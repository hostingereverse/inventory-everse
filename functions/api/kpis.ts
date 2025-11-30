// Cloudflare Pages Function: Get KPIs for dashboard
import { DB } from '../../../src/lib/db';
import { calculateKPIs } from '../../../src/lib/kpis';

export async function onRequestGet(context: any) {
  const { env } = context;
  const db = new DB(env.DB);

  try {
    const kpis = await calculateKPIs(db);
    return new Response(JSON.stringify(kpis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

