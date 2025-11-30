// Auto-match OrderID from uploaded TXT/CSV and update existing sales rows
import type { Context } from '@cloudflare/workers-types';
import { parseTxtFile } from '../../../src/lib/smart-txt-parser';

export async function onRequestPost(context: Context) {
  const { request, env } = context;
  const { DB, AI } = env;

  try {
    const { order_id, updates } = await request.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find existing sale by order_id
    const existing = await DB.prepare(
      'SELECT * FROM sales WHERE order_id = ?'
    ).bind(order_id).first();

    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'Order not found', order_id }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update fields
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.price !== undefined) {
      updateFields.push('amount = ?');
      updateValues.push(updates.price);
    }
    if (updates.email !== undefined) {
      updateFields.push('customer_email = ?');
      updateValues.push(updates.email);
    }
    if (updates.delivery_days !== undefined) {
      updateFields.push('delivery_days = ?');
      updateValues.push(updates.delivery_days);
    }
    if (updates.payment_status !== undefined) {
      updateFields.push('payment_status = ?');
      updateValues.push(updates.payment_status);
    }

    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No updates provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    updateValues.push(order_id);

    await DB.prepare(
      `UPDATE sales SET ${updateFields.join(', ')} WHERE order_id = ?`
    )
      .bind(...updateValues)
      .run();

    // Log activity
    const userEmail = request.headers.get('cf-access-authenticated-user-email') || 'system';
    await DB.prepare(
      `INSERT INTO activity_log (user_email, action, details)
       VALUES (?, ?, ?)`
    )
      .bind(userEmail, 'match_update', JSON.stringify({ order_id, updates }))
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        updated_fields: updateFields.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

