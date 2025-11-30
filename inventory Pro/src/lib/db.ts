// TypeScript database helper functions for Cloudflare D1

export type Inventory = {
  id?: number;
  sku: string;
  name: string;
  category?: string;
  supplier?: string;
  warehouse: string;
  stock: number;
  cost_price: number;
  sell_price: number;
  reorder_point: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type Sale = {
  id?: number;
  date: string;
  order_id?: string;
  delivery_location?: string;
  product?: string; // TEXT field, not product_id
  status?: string;
  sp?: number; // Selling Price (SP)
  cp?: number; // Cost Price (CP)
  gst?: string;
  sales_person?: string;
  remarks?: string;
  quantity?: number;
  customer_email?: string;
  payment_status?: string;
  delivery_days?: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy/compatibility fields
  amount?: number; // Alias for sp
  product_id?: number; // Not in schema, but used for calculations
};

export type Account = {
  id?: number;
  name: string;
  type: string;
  credit_limit?: number;
  balance?: number;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  created_at?: string;
  updated_at?: string;
};

export type AdSpend = {
  id?: number;
  date: string;
  campaign?: string;
  platform?: string;
  spend: number;
  attributed_sales?: number;
  created_at?: string;
};

export type StockMovement = {
  id?: number;
  product_id: number;
  type: string;
  quantity: number;
  reason?: string;
  warehouse?: string;
  reference?: string;
  date: string;
  created_by?: string;
};

export type Category = {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
};

// Database helper class
export class DB {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Inventory operations
  async getInventory(warehouse?: string): Promise<Inventory[]> {
    const query = warehouse
      ? `SELECT * FROM inventory WHERE warehouse = ? ORDER BY name`
      : `SELECT * FROM inventory ORDER BY name`;
    const params = warehouse ? [warehouse] : [];
    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as Inventory[];
  }

  async getInventoryById(id: number): Promise<Inventory | null> {
    const result = await this.db.prepare('SELECT * FROM inventory WHERE id = ?').bind(id).first();
    return result as Inventory | null;
  }

  async getInventoryBySku(sku: string): Promise<Inventory | null> {
    const result = await this.db.prepare('SELECT * FROM inventory WHERE sku = ?').bind(sku).first();
    return result as Inventory | null;
  }

  async createInventory(item: Inventory): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT INTO inventory (sku, name, category, supplier, warehouse, stock, cost_price, sell_price, reorder_point, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        item.sku,
        item.name,
        item.category || null,
        item.supplier || null,
        item.warehouse,
        item.stock,
        item.cost_price,
        item.sell_price,
        item.reorder_point,
        item.image_url || null
      )
      .run();
    return result.meta.last_row_id || 0;
  }

  async updateInventory(id: number, item: Partial<Inventory>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = datetime("now")');
    values.push(id);

    await this.db
      .prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async deleteInventory(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM inventory WHERE id = ?').bind(id).run();
  }

  // Sales operations
  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = 'SELECT * FROM sales ORDER BY date DESC, order_id DESC';
    const params: any[] = [];

    if (startDate && endDate) {
      query = 'SELECT * FROM sales WHERE date >= ? AND date <= ? ORDER BY date DESC, order_id DESC';
      params.push(startDate, endDate);
    } else if (startDate) {
      query = 'SELECT * FROM sales WHERE date >= ? ORDER BY date DESC, order_id DESC';
      params.push(startDate);
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as Sale[];
  }

  async createSale(sale: Sale): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT OR REPLACE INTO sales 
         (order_id, date, delivery_location, product, status, sp, cp, gst, sales_person, remarks, quantity, customer_email, payment_status, delivery_days, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        sale.order_id || null,
        sale.date,
        (sale as any).delivery_location || null,
        (sale as any).product || null,
        (sale as any).status || 'PROCESSING',
        sale.amount || (sale as any).sp || null,
        (sale as any).cp || null,
        (sale as any).gst || null,
        (sale as any).sales_person || null,
        (sale as any).remarks || null,
        sale.quantity || 1,
        (sale as any).customer_email || null,
        (sale as any).payment_status || 'pending',
        sale.delivery_days || null,
        (sale as any).source || 'manual'
      )
      .run();
    return result.meta.last_row_id || 0;
  }

  // Account operations
  async getAccounts(type?: string): Promise<Account[]> {
    // Note: accounts table uses supplier_name, not name/type
    // This is a simplified schema for supplier data
    const query = `SELECT * FROM accounts ORDER BY supplier_name`;
    const result = await this.db.prepare(query).bind().all();
    return result.results as Account[];
  }

  async createAccount(account: Account): Promise<number> {
    // Note: Actual schema only supports supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id
    // Map Account interface fields to actual schema
    const accountAny = account as any;
    const result = await this.db
      .prepare(
        `INSERT INTO accounts (supplier_name, purchase_rate, quantity, payment_date, payment_method, invoice_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        account.name || accountAny.supplier_name || '',
        accountAny.purchase_rate || 0,
        accountAny.quantity || 1,
        accountAny.payment_date || new Date().toISOString().split('T')[0],
        accountAny.payment_method || null,
        accountAny.invoice_id || null
      )
      .run();
    return result.meta.last_row_id || 0;
  }

  // Stock movement operations
  async createStockMovement(movement: StockMovement): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT INTO stock_movements (product_id, type, quantity, reason, warehouse, reference, date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        movement.product_id,
        movement.type,
        movement.quantity,
        movement.reason || null,
        movement.warehouse || null,
        movement.reference || null,
        movement.date,
        movement.created_by || 'system'
      )
      .run();
    return result.meta.last_row_id || 0;
  }

  async getStockMovements(productId?: number, limit = 100): Promise<StockMovement[]> {
    const query = productId
      ? `SELECT * FROM stock_movements WHERE product_id = ? ORDER BY date DESC LIMIT ?`
      : `SELECT * FROM stock_movements ORDER BY date DESC LIMIT ?`;
    const params = productId ? [productId, limit] : [limit];
    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as StockMovement[];
  }

  // Ad spend operations
  async getAdSpends(startDate?: string, endDate?: string): Promise<AdSpend[]> {
    let query = 'SELECT * FROM ad_spends ORDER BY date DESC';
    const params: any[] = [];

    if (startDate && endDate) {
      query = 'SELECT * FROM ad_spends WHERE date >= ? AND date <= ? ORDER BY date DESC';
      params.push(startDate, endDate);
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as AdSpend[];
  }

  async createAdSpend(spend: AdSpend): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT INTO ad_spends (date, campaign, platform, spend, attributed_sales)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        spend.date,
        spend.campaign || null,
        spend.platform || null,
        spend.spend,
        spend.attributed_sales || 0
      )
      .run();
    return result.meta.last_row_id || 0;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    const result = await this.db.prepare('SELECT * FROM categories ORDER BY name').all();
    return result.results as Category[];
  }

  async createCategory(category: Category): Promise<number> {
    const result = await this.db
      .prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
      .bind(category.name, category.description || null)
      .run();
    return result.meta.last_row_id || 0;
  }

  // Settings operations
  async getSetting(key: string): Promise<string | null> {
    const result = await this.db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
    return result ? (result as { value: string }).value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))')
      .bind(key, value)
      .run();
  }
}

