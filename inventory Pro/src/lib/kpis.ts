// KPI calculation functions

import { DB } from './db';
import type { Inventory, Sale, AdSpend } from './db';
import { formatDate, getDateRange } from './utils';

export interface KPIs {
  totalInventoryValue: number;
  totalItems: number;
  totalGaps: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCOGS: number;
  totalProfit: number;
  totalAdSpend: number;
  netProfit: number;
  lowStockItems: number;
  deadStockItems: number;
  avgInventoryTurnover: number;
}

export async function calculateKPIs(db: DB, warehouse?: string): Promise<KPIs> {
  const { start, end } = getDateRange(30); // Last 30 days

  // Get inventory
  const inventory = await db.getInventory(warehouse);
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.stock * item.cost_price,
    0
  );
  const totalItems = inventory.reduce((sum, item) => sum + item.stock, 0);
  
  const lowStockItems = inventory.filter((item) => item.stock <= item.reorder_point).length;
  
  // Dead stock: items with no sales in last 90 days
  const sales90Days = await db.getSales(getDateRange(90).start, end);
  const soldProductNames = new Set(
    sales90Days
      .map((s) => (s as any).product)
      .filter(Boolean)
      .map((p: string) => p.toLowerCase().trim())
  );
  const deadStockItems = inventory.filter(
    (item) => item.stock > 0 && !soldProductNames.has(item.name.toLowerCase().trim())
  ).length;

  // Get sales for last 30 days
  const sales = await db.getSales(start, end);
  const totalRevenue = sales.reduce((sum, sale) => {
    // Use SP (selling price) if available, otherwise fallback to amount (legacy)
    const saleAny = sale as any;
    return sum + (saleAny.sp || saleAny.amount || 0) * (saleAny.quantity || 1);
  }, 0);
  
  // Calculate COGS (Cost of Goods Sold)
  const totalCOGS = sales.reduce((sum, sale) => {
    const saleAny = sale as any;
    // Use CP (cost price) from sales if available
    if (saleAny.cp) {
      return sum + saleAny.cp * (saleAny.quantity || 1);
    }
    // Otherwise, try to find product and use its cost price
    if (saleAny.product && typeof saleAny.product === 'string') {
      const productName = saleAny.product.toLowerCase().trim();
      const product = inventory.find((p) => 
        (p.name && p.name.toLowerCase().trim() === productName) ||
        (p.sku && p.sku.toLowerCase().trim() === productName)
      );
      if (product && product.cost_price) {
        return sum + product.cost_price * (saleAny.quantity || 1);
      }
    }
    return sum;
  }, 0);

  const totalProfit = totalRevenue - totalCOGS;

  // Get ad spends
  const adSpends = await db.getAdSpends(start, end);
  const totalAdSpend = adSpends.reduce((sum, ad) => sum + ad.spend, 0);
  const netProfit = totalProfit - totalAdSpend;

  // Calculate gaps (inventory needed - current stock)
  const totalGaps = 0; // TODO: Calculate from unfulfilled orders

  // Pending orders (orders with status PROCESSING, SHIPPED, or payment_status pending)
  const pendingOrders = sales.filter((s) => {
    const status = (s as any).status || '';
    const paymentStatus = (s as any).payment_status || 'pending';
    return status === 'PROCESSING' || status === 'SHIPPED' || paymentStatus === 'pending';
  }).length;

  // Inventory turnover
  const avgInventory = totalInventoryValue / 2; // Simplified average
  const avgInventoryTurnover = avgInventory > 0 ? totalCOGS / avgInventory : 0;

  return {
    totalInventoryValue,
    totalItems,
    totalGaps,
    pendingOrders,
    totalRevenue,
    totalCOGS,
    totalProfit,
    totalAdSpend,
    netProfit,
    lowStockItems,
    deadStockItems,
    avgInventoryTurnover,
  };
}

export async function getFastMovingProducts(db: DB, limit = 10): Promise<Array<Inventory & { salesCount: number }>> {
  const { start, end } = getDateRange(30);
  const sales = await db.getSales(start, end);
  const inventory = await db.getInventory();

  // Group sales by product name/SKU (not product_id since it doesn't exist)
  const salesCount = new Map<string, number>();
  sales.forEach((sale) => {
    const saleAny = sale as any;
    const productKey = (saleAny.product || '').toLowerCase().trim();
    if (productKey) {
      salesCount.set(productKey, (salesCount.get(productKey) || 0) + (saleAny.quantity || 1));
    }
  });

  return inventory
    .map((item) => {
      const productKey = item.name.toLowerCase().trim();
      const skuKey = item.sku.toLowerCase().trim();
      const count = salesCount.get(productKey) || salesCount.get(skuKey) || 0;
      return {
        ...item,
        salesCount: count,
      };
    })
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, limit);
}

export async function getSlowMovingProducts(db: DB, limit = 10): Promise<Inventory[]> {
  const { start, end } = getDateRange(90);
  const sales = await db.getSales(start, end);
  const inventory = await db.getInventory();

  const soldProductNames = new Set(
    sales
      .map((s) => (s as any).product)
      .filter(Boolean)
      .map((p: string) => p.toLowerCase().trim())
  );

  return inventory
    .filter((item) => {
      const itemName = (item.name || '').toLowerCase().trim();
      const itemSku = (item.sku || '').toLowerCase().trim();
      return !soldProductNames.has(itemName) && 
             !soldProductNames.has(itemSku) && 
             (item.stock || 0) > 0;
    })
    .slice(0, limit);
}

