// Handle CSV, Excel (.xlsx), and smart TXT file uploads
import type { Context } from '@cloudflare/workers-types';
import { parseTxtFile } from '../../../src/lib/smart-txt-parser';

export async function onRequestPost(context: Context) {
  const { request, env } = context;
  const { DB, AI } = env;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'inventory', 'sales', 'accounts', 'txt'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = request.headers.get('cf-access-authenticated-user-email') || 'system';
    let imported = 0;
    let errors: string[] = [];

    // Handle TXT files with smart parser
    if (file.name.endsWith('.txt')) {
      const text = await file.text();
      const parsed = await parseTxtFile(text, AI);

      for (const item of parsed) {
        try {
          if (item.order_id && item.price) {
            // It's a sales/order entry
            await DB.prepare(
              `INSERT OR REPLACE INTO sales 
               (order_id, date, amount, customer_email, delivery_days, payment_status, source)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                item.order_id,
                item.payment_date || new Date().toISOString().split('T')[0],
                item.price,
                item.email || null,
                item.delivery_days || null,
                item.payment_status || 'pending',
                'txt_upload'
              )
              .run();
            imported++;
          } else if (item.supplier_name && item.purchase_rate) {
            // It's a supplier/account entry
            await DB.prepare(
              `INSERT OR REPLACE INTO accounts 
               (supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
              .bind(
                item.supplier_name,
                item.purchase_rate,
                item.quantity || 1,
                item.payment_date || new Date().toISOString().split('T')[0],
                item.payment_method || null,
                item.invoice_id || null
              )
              .run();
            imported++;
          }
        } catch (error: any) {
          errors.push(`Line "${item.raw_line}": ${error.message}`);
        }
      }

      // Log activity
      await DB.prepare(
        `INSERT INTO activity_log (user_email, action, details)
         VALUES (?, ?, ?)`
      )
        .bind(userEmail, 'upload_txt', JSON.stringify({ filename: file.name, imported, errors: errors.length }))
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          imported,
          errors: errors.slice(0, 10), // Return first 10 errors
          message: `Imported ${imported} records from TXT file`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle CSV files
    if (file.name.endsWith('.csv')) {
      const csvText = await file.text();
      const Papa = await import('papaparse');
      const result = Papa.default.parse(csvText, { header: true, skipEmptyLines: true });
      const rows = result.data as any[];

      for (const row of rows) {
        try {
          if (type === 'inventory') {
            const sku = row['SKU'] || row['sku'] || row['ProductID'] || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            await DB.prepare(
              `INSERT OR REPLACE INTO inventory 
               (sku, name, category, stock, cost_price, sell_price, reorder_point, warehouse)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                sku,
                row['Name'] || row['Product'] || '',
                row['Category'] || null,
                parseInt(row['Stock'] || row['stock'] || '0'),
                parseFloat(row['Cost Price'] || row['UnitCost'] || row['cost_price'] || '0'),
                parseFloat(row['Sell Price'] || row['SP'] || row['sell_price'] || '0'),
                parseInt(row['Reorder Point'] || row['ReorderLevel'] || '10'),
                row['Warehouse'] || 'Bangalore'
              )
              .run();
            imported++;
          } else if (type === 'sales') {
            const orderId = row['Order id'] || row['Order ID'] || row['OrderID'] || row['order_id'] || `ORD-${Date.now()}`;
            
            if (!orderId) continue; // Skip rows without order ID

            // Parse date (format: 11-01, 11-03, etc.)
            let dateStr = row['Date'] || row['date'] || new Date().toISOString().split('T')[0];
            if (dateStr && dateStr.includes('-') && !dateStr.includes('20')) {
              const parts = dateStr.split('-');
              if (parts.length === 2) {
                const [monthNum, day] = parts;
                const currentYear = new Date().getFullYear();
                dateStr = `${currentYear}-${monthNum.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }

            const status = (row['Status'] || row['status'] || 'PROCESSING').toUpperCase();
            let paymentStatus = 'pending';
            if (status === 'DELIVERED') {
              paymentStatus = 'paid';
            } else if (status === 'CANCELLED') {
              paymentStatus = 'cancelled';
            } else if (status === 'SHIPPED') {
              paymentStatus = 'pending';
            }

            await DB.prepare(
              `INSERT OR REPLACE INTO sales 
               (order_id, date, delivery_location, product, status, sp, cp, gst, sales_person, remarks, payment_status, source, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            )
              .bind(
                orderId.toString().trim(),
                dateStr,
                row['DELIVERY LOCATION'] || row['Delivery Location'] || row['delivery_location'] || null,
                row['Product'] || row['product'] || '',
                status,
                parseFloat(row['SP'] || row['Amount'] || row['Total Price'] || '0'),
                row['CP'] ? parseFloat(row['CP']) : null,
                row['GST'] || null,
                row['SALES PERSON'] || row['Sales Person'] || row['sales_person'] || null,
                row['REMARKS'] || row['Remarks'] || row['remarks'] || null,
                paymentStatus,
                'csv_upload'
              )
              .run();
            imported++;
          } else if (type === 'accounts') {
            await DB.prepare(
              `INSERT OR REPLACE INTO accounts 
               (supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
              .bind(
                row['Supplier Name'] || row['supplier_name'] || '',
                parseFloat(row['Purchase Rate'] || row['Rate'] || row['purchase_rate'] || '0'),
                parseInt(row['Quantity'] || row['Qty'] || row['quantity'] || '1'),
                row['Payment Date'] || row['payment_date'] || new Date().toISOString().split('T')[0],
                row['Payment Method'] || row['payment_method'] || null,
                row['Invoice ID'] || row['invoice_id'] || null
              )
              .run();
            imported++;
          }
        } catch (error: any) {
          errors.push(`Row error: ${error.message}`);
        }
      }
    }
    // Handle Excel files
    else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      for (const row of rows as any[]) {
        try {
          // Same logic as CSV but handle Excel column names
          if (type === 'inventory') {
            const sku = row['SKU'] || row['sku'] || `SKU-${Date.now()}`;
            await DB.prepare(
              `INSERT OR REPLACE INTO inventory 
               (sku, name, category, stock, cost_price, sell_price, reorder_point, warehouse)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            )
              .bind(
                sku,
                row['Name'] || '',
                row['Category'] || null,
                parseInt(row['Stock'] || '0'),
                parseFloat(row['Cost Price'] || '0'),
                parseFloat(row['Sell Price'] || '0'),
                parseInt(row['Reorder Point'] || '10'),
                row['Warehouse'] || 'Bangalore'
              )
              .run();
            imported++;
          }
          // Similar for sales and accounts...
        } catch (error: any) {
          errors.push(`Row error: ${error.message}`);
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file format. Use .csv, .xlsx, or .txt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log activity
    await DB.prepare(
      `INSERT INTO activity_log (user_email, action, details)
       VALUES (?, ?, ?)`
    )
      .bind(userEmail, 'upload_file', JSON.stringify({ filename: file.name, type, imported, errors: errors.length }))
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        errors: errors.slice(0, 10),
        message: `Successfully imported ${imported} records`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
