// Sync Google Sheets every 3 hours
// Cron trigger must be configured in Cloudflare Pages Dashboard:
// Workers & Pages → Your Project → Settings → Functions → Cron Triggers
// Schedule: "0 */3 * * *" → Target: /api/sync-sheets
//
// Environment variables must be set in Cloudflare Pages Dashboard:
// Settings → Environment Variables

import type { Context } from '@cloudflare/workers-types';

export async function onRequest(context: Context) {
  const { env } = context;
  const { DB } = env;

  try {
    const results = {
      sales: { imported: 0, errors: [] as string[] },
      inventory: { imported: 0, errors: [] as string[] },
      accounts: { imported: 0, errors: [] as string[] },
      ads: { imported: 0, errors: [] as string[] },
    };

    // Sync Sales Sheets - Multiple tabs (November, October, September)
    const salesUrls = [
      { url: env.GOOGLE_SHEET_SALES_NOV_URL, month: 'November' },
      { url: env.GOOGLE_SHEET_SALES_OCT_URL, month: 'October' },
      { url: env.GOOGLE_SHEET_SALES_SEP_URL, month: 'September' },
      // Legacy support
      { url: env.GOOGLE_SHEET_SALES_URL, month: 'Current' },
    ].filter(item => item.url);

    for (const { url, month } of salesUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          results.sales.errors.push(`${month}: HTTP ${response.status}`);
          continue;
        }
        
        const csvText = await response.text();
        const Papa = await import('papaparse');
        const parsed = Papa.default.parse(csvText, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data as any[]) {
          try {
            // Map Google Sheets columns to database
            const orderId = row['Order id'] || row['Order ID'] || row['OrderID'] || row['order_id'] || row['Order id'];
            
            if (!orderId) {
              continue; // Skip rows without order ID
            }

            // Parse date (format: 11-01, 11-03, etc. - assume current year)
            let dateStr = row['Date'] || row['date'] || '';
            if (dateStr && dateStr.includes('-') && !dateStr.includes('20')) {
              // Convert format like "11-01" to full date
              const parts = dateStr.split('-');
              if (parts.length === 2) {
                const [monthNum, day] = parts;
                const currentYear = new Date().getFullYear();
                dateStr = `${currentYear}-${monthNum.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            } else if (!dateStr) {
              dateStr = new Date().toISOString().split('T')[0];
            }

            // Determine payment status from Status column
            const status = (row['Status'] || row['status'] || 'PROCESSING').toUpperCase();
            let paymentStatus = 'pending';
            if (status === 'DELIVERED') {
              paymentStatus = 'paid';
            } else if (status === 'CANCELLED') {
              paymentStatus = 'cancelled';
            } else if (status === 'SHIPPED' || status === 'PROCESSING') {
              paymentStatus = 'pending';
            }

            // Parse SP (Selling Price)
            const sp = parseFloat(row['SP'] || row['sp'] || row['Selling Price'] || '0');
            
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
                sp || null,
                row['CP'] ? parseFloat(row['CP']) : null, // Cost Price
                row['GST'] || null,
                row['SALES PERSON'] || row['Sales Person'] || row['sales_person'] || null,
                row['REMARKS'] || row['Remarks'] || row['remarks'] || null,
                paymentStatus,
                `google_sheets_${month.toLowerCase()}`
              )
              .run();
            
            results.sales.imported++;
          } catch (error: any) {
            results.sales.errors.push(`${month} - Row "${row['Order id'] || 'unknown'}": ${error.message}`);
          }
        }
      } catch (error: any) {
        results.sales.errors.push(`${month}: ${error.message}`);
      }
    }

    // Sync Inventory - Bangalore
    if (env.GOOGLE_SHEET_INVENTORY_BANGALORE_URL) {
      try {
        const response = await fetch(env.GOOGLE_SHEET_INVENTORY_BANGALORE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        const Papa = await import('papaparse');
        const parsed = Papa.default.parse(csvText, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data as any[]) {
          try {
            // Map inventory columns (adjust based on actual CSV format)
            const sku = row['SKU'] || row['sku'] || row['ProductID'] || row['Product ID'] || `SKU-${Date.now()}`;
            const name = row['Name'] || row['Product'] || row['product'] || row['Product Name'] || '';
            
            if (!name) continue; // Skip rows without product name

            await DB.prepare(
              `INSERT OR REPLACE INTO inventory 
               (sku, name, category, stock, cost_price, sell_price, reorder_point, warehouse, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
            )
              .bind(
                sku.toString().trim(),
                name,
                row['Category'] || row['category'] || null,
                parseInt(row['Stock'] || row['stock'] || row['Quantity'] || '0'),
                parseFloat(row['Cost Price'] || row['CP'] || row['UnitCost'] || row['cost_price'] || '0'),
                parseFloat(row['Sell Price'] || row['SP'] || row['SP'] || row['sell_price'] || '0'),
                parseInt(row['Reorder Point'] || row['ReorderLevel'] || row['reorder_point'] || '10'),
                'Bangalore'
              )
              .run();
            
            results.inventory.imported++;
          } catch (error: any) {
            results.inventory.errors.push(`Row error: ${error.message}`);
          }
        }
      } catch (error: any) {
        results.inventory.errors.push(error.message);
      }
    }

    // Sync Accounts Sheet
    if (env.GOOGLE_SHEET_ACCOUNTS_URL) {
      try {
        const response = await fetch(env.GOOGLE_SHEET_ACCOUNTS_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        const Papa = await import('papaparse');
        const parsed = Papa.default.parse(csvText, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data as any[]) {
          try {
            await DB.prepare(
              `INSERT OR REPLACE INTO accounts 
               (supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id)
               VALUES (?, ?, ?, ?, ?, ?)`
            )
              .bind(
                row['Supplier Name'] || row['supplier_name'] || '',
                parseFloat(row['Purchase Rate'] || row['Rate'] || '0'),
                parseInt(row['Quantity'] || row['Qty'] || '1'),
                row['Payment Date'] || row['payment_date'] || new Date().toISOString().split('T')[0],
                row['Payment Method'] || row['payment_method'] || null,
                row['Invoice ID'] || row['invoice_id'] || null
              )
              .run();
            
            results.accounts.imported++;
          } catch (error: any) {
            results.accounts.errors.push(`Row error: ${error.message}`);
          }
        }
      } catch (error: any) {
        results.accounts.errors.push(error.message);
      }
    }

    // Sync Ad Spends Sheet
    if (env.GOOGLE_SHEET_ADS_URL) {
      try {
        const response = await fetch(env.GOOGLE_SHEET_ADS_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        const Papa = await import('papaparse');
        const parsed = Papa.default.parse(csvText, { header: true, skipEmptyLines: true });
        
        for (const row of parsed.data as any[]) {
          try {
            await DB.prepare(
              `INSERT OR REPLACE INTO ad_spends 
               (date, campaign, platform, spend, attributed_sales)
               VALUES (?, ?, ?, ?, ?)`
            )
              .bind(
                row['Date'] || row['date'] || new Date().toISOString().split('T')[0],
                row['Campaign'] || row['campaign'] || null,
                row['Platform'] || row['platform'] || null,
                parseFloat(row['Spend'] || row['spend'] || '0'),
                row['Attributed Sales'] ? parseFloat(row['Attributed Sales']) : 0
              )
              .run();
            
            results.ads.imported++;
          } catch (error: any) {
            results.ads.errors.push(`Row error: ${error.message}`);
          }
        }
      } catch (error: any) {
        results.ads.errors.push(error.message);
      }
    }

    // Log sync activity
    await DB.prepare(
      `INSERT INTO activity_log (user_email, action, details)
       VALUES (?, ?, ?)`
    )
      .bind('system', 'sync_sheets', JSON.stringify(results))
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
