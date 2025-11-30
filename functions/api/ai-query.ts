// AI-powered natural language query using Workers AI
// User asks in English → AI converts to SQL → returns results + Chart.js data
import type { Context } from '@cloudflare/workers-types';

export async function onRequestPost(context: Context) {
  const { request, env } = context;
  const { DB, AI } = env;

  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query string required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!AI) {
      return new Response(
        JSON.stringify({ error: 'Workers AI not available' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get database schema for context
    const schema = `
      Tables:
      - inventory: id, sku, name, category, stock, cost_price, sell_price, warehouse, reorder_point
      - sales: id, order_id, date, product (TEXT), delivery_location, status, sp (Selling Price), cp (Cost Price), gst, sales_person, remarks, quantity, customer_email, payment_status, delivery_days, source
      - accounts: id, supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id
      - ad_spends: id, date, campaign, platform, spend, attributed_sales
    `;

    // Use AI to convert natural language to SQL
    const prompt = `${schema}

User question: "${query}"

Convert this to a SQL query for SQLite. Return ONLY the SQL query, no explanation.
Examples:
- "Show low stock" → SELECT * FROM inventory WHERE stock <= reorder_point
- "Total sales this month" → SELECT SUM(amount) FROM sales WHERE date >= date('now', 'start of month')
- "Price differences" → SELECT sku, sell_price, scraped_price FROM inventory WHERE scraped_price IS NOT NULL AND scraped_price != sell_price
`;

    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    const sqlQuery = (aiResponse.response || aiResponse.text || '').trim()
      .replace(/```sql/g, '')
      .replace(/```/g, '')
      .split('\n')
      .find((line: string) => line.trim().toUpperCase().startsWith('SELECT'));

    if (!sqlQuery) {
      return new Response(
        JSON.stringify({ error: 'Could not generate SQL query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Execute SQL query
    let result;
    try {
      const stmt = DB.prepare(sqlQuery);
      result = await stmt.all();
    } catch (error: any) {
      // If direct SQL fails, try common queries
      if (query.toLowerCase().includes('low stock')) {
        result = await DB.prepare(
          'SELECT * FROM inventory WHERE stock <= reorder_point ORDER BY stock ASC'
        ).all();
      } else if (query.toLowerCase().includes('sales') && query.toLowerCase().includes('month')) {
        result = await DB.prepare(
          `SELECT SUM(sp * COALESCE(quantity, 1)) as total FROM sales WHERE date >= date('now', 'start of month')`
        ).all();
      } else {
        throw error;
      }
    }

    // Format data for Chart.js
    const chartData = formatForChart(result.results || [], query);

    // Log activity
    const userEmail = request.headers.get('cf-access-authenticated-user-email') || 'system';
    await DB.prepare(
      `INSERT INTO activity_log (user_email, action, details)
       VALUES (?, ?, ?)`
    )
      .bind(userEmail, 'ai_query', JSON.stringify({ query, sql: sqlQuery }))
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        query,
        sql: sqlQuery,
        data: result.results,
        chart: chartData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('AI query error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'AI query failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Format data for Chart.js visualization
function formatForChart(data: any[], query: string): any {
  if (!data || data.length === 0) {
    return { type: 'bar', labels: [], datasets: [] };
  }

  const queryLower = query.toLowerCase();

  // Sales over time
  if (queryLower.includes('sales') && (queryLower.includes('time') || queryLower.includes('date'))) {
    const grouped = data.reduce((acc: any, item: any) => {
      const date = item.date || item.payment_date;
      const value = item.sp || item.amount || 0;
      const qty = item.quantity || 1;
      acc[date] = (acc[date] || 0) + (value * qty);
      return acc;
    }, {});

    return {
      type: 'line',
      labels: Object.keys(grouped).sort(),
      datasets: [{
        label: 'Sales',
        data: Object.keys(grouped).sort().map((date) => grouped[date]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }],
    };
  }

  // Category distribution
  if (queryLower.includes('category')) {
    const grouped = data.reduce((acc: any, item: any) => {
      const cat = item.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    return {
      type: 'pie',
      labels: Object.keys(grouped),
      datasets: [{
        data: Object.values(grouped),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      }],
    };
  }

  // Default bar chart
  const firstKey = Object.keys(data[0] || {})[0];
  const secondKey = Object.keys(data[0] || {})[1];

  return {
    type: 'bar',
    labels: data.map((item) => item[firstKey] || 'N/A'),
    datasets: [{
      label: secondKey || 'Value',
      data: data.map((item) => item[secondKey] || 0),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
    }],
  };
}

