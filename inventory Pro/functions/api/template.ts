// Generate and download CSV/Excel templates for Accounts and Sales
import type { Context } from '@cloudflare/workers-types';

export async function onRequest(context: Context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'accounts' or 'sales'

  try {
    if (type === 'accounts') {
      // Generate Accounts template
      const XLSX = await import('xlsx');
      const data = [
        {
          'Supplier Name': 'ABC Electronics',
          'Purchase Rate': 850,
          'Quantity': 50,
          'Payment Date': '2025-11-30',
          'Payment Method': 'UPI',
          'Invoice ID': 'INV-2025-001',
        },
        {
          'Supplier Name': 'XYZ Suppliers',
          'Purchase Rate': 1200,
          'Quantity': 25,
          'Payment Date': '2025-11-29',
          'Payment Method': 'Bank Transfer',
          'Invoice ID': 'INV-2025-002',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="Accounts_Template.xlsx"',
        },
      });
    } else if (type === 'sales') {
      // Generate Sales template
      const XLSX = await import('xlsx');
      const data = [
        {
          'Order ID': 'ORD-2025-001',
          'Date': '2025-11-30',
          'Amount': 1299,
          'Customer Email': 'john@company.com',
          'Delivery Days': 4,
          'Payment Status': 'paid',
        },
        {
          'Order ID': 'ORD-2025-002',
          'Date': '2025-11-29',
          'Amount': 899,
          'Customer Email': 'jane@company.com',
          'Delivery Days': 2,
          'Payment Status': 'pending',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="Sales_Template.xlsx"',
        },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid template type. Use ?type=accounts or ?type=sales' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

