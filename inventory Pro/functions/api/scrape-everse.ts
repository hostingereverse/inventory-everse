// Scrape product name and price from everse.in using Cheerio
import type { Context } from '@cloudflare/workers-types';

export async function onRequestPost(context: Context) {
  const { request, env } = context;
  const db = env.DB;

  try {
    const { url } = await request.json();

    if (!url || !url.includes('everse.in')) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL - must be from everse.in' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the page
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch page' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Use Cheerio to parse HTML (loaded dynamically in Node.js compat mode)
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    // Extract product name and price (adjust selectors based on everse.in structure)
    const name =
      $('h1.product-title, h1.product-name, .product-title, [class*="product"] h1').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    // Try multiple price selectors
    const priceText =
      $('.price, .product-price, [class*="price"]').first().text().trim() ||
      $('[data-price]').attr('data-price') ||
      $('meta[property="product:price:amount"]').attr('content');

    // Extract numeric price
    const priceMatch = priceText?.match(/[₹$]?\s*([0-9,]+(?:\.[0-9]+)?)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

    if (!name || !price) {
      return new Response(
        JSON.stringify({ error: 'Could not extract product name or price' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract SKU if available
    const sku =
      $('[data-sku], .sku, [class*="sku"]').first().text().trim() ||
      url.split('/').pop()?.split('-').pop();

    // Save to scraped_prices table
    const scrapedAt = new Date().toISOString();
    
    await db.prepare(
      `INSERT OR REPLACE INTO scraped_prices (sku, name, price, url, scraped_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(sku || null, name, price, url, scrapedAt)
      .run();

    // Update inventory if SKU matches
    if (sku) {
      await db.prepare(
        `UPDATE inventory 
         SET scraped_price = ?, scraped_at = ?, everse_url = ?
         WHERE sku = ?`
      )
        .bind(price, scrapedAt, url, sku)
        .run();
    }

    // Log activity
    const userEmail = request.headers.get('cf-access-authenticated-user-email') || 'system';
    await db.prepare(
      `INSERT INTO activity_log (user_email, action, details)
       VALUES (?, ?, ?)`
    )
      .bind(userEmail, 'scrape_product', JSON.stringify({ url, name, price, sku }))
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        data: { name, price, sku, url, scraped_at: scrapedAt },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Scraping failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

