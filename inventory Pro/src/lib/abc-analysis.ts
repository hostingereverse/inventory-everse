// ABC & XYZ analysis for inventory classification

import { DB } from './db';
import type { Inventory, Sale } from './db';
import { getDateRange } from './utils';

export interface ABCClassification {
  product: Inventory;
  annualValue: number; // Annual revenue potential
  cumulativeValue: number;
  cumulativePercentage: number;
  classification: 'A' | 'B' | 'C';
}

export interface XYZClassification {
  product: Inventory;
  coefficientOfVariation: number; // Demand variability
  classification: 'X' | 'Y' | 'Z';
}

export async function performABCAnalysis(
  db: DB,
  sales: Sale[],
  inventory: Inventory[]
): Promise<ABCClassification[]> {
  // Calculate annual value for each product (by name/SKU since product_id doesn't exist)
  const productValues = new Map<string, number>();

  sales.forEach((sale) => {
    const saleAny = sale as any;
    const productKey = (saleAny.product || '').toLowerCase().trim();
    if (productKey) {
      const current = productValues.get(productKey) || 0;
      // Project 30-day sales to annual (simplified)
      const value = (saleAny.sp || saleAny.amount || 0) * (saleAny.quantity || 1);
      productValues.set(productKey, current + value * 12);
    }
  });

  // Create ABC classifications
  const classifications: ABCClassification[] = inventory.map((product) => {
    const productKey = (product.name || '').toLowerCase().trim();
    const skuKey = (product.sku || '').toLowerCase().trim();
    const annualValue = productValues.get(productKey) || productValues.get(skuKey) || 0;
    return {
      product,
      annualValue,
      cumulativeValue: 0,
      cumulativePercentage: 0,
      classification: 'C',
    };
  });

  // Sort by annual value descending
  classifications.sort((a, b) => b.annualValue - a.annualValue);

  // Calculate cumulative values
  const totalValue = classifications.reduce((sum, item) => sum + item.annualValue, 0);
  let cumulative = 0;

  classifications.forEach((item) => {
    cumulative += item.annualValue;
    item.cumulativeValue = cumulative;
    item.cumulativePercentage = totalValue > 0 ? (cumulative / totalValue) * 100 : 0;

    // Classify: A = 80%, B = 15%, C = 5% (Pareto principle)
    if (item.cumulativePercentage <= 80) {
      item.classification = 'A';
    } else if (item.cumulativePercentage <= 95) {
      item.classification = 'B';
    } else {
      item.classification = 'C';
    }
  });

  return classifications;
}

export async function performXYZAnalysis(
  db: DB,
  sales: Sale[],
  inventory: Inventory[]
): Promise<XYZClassification[]> {
  const { start } = getDateRange(90); // 90 days for demand variability

  // Calculate demand variability (coefficient of variation) for each product
  const productDemands = new Map<string, number[]>();

  // Group sales by product name/SKU (not product_id since it doesn't exist)
  sales.forEach((sale) => {
    const saleAny = sale as any;
    const productKey = (saleAny.product || '').toLowerCase().trim();
    if (productKey) {
      if (!productDemands.has(productKey)) {
        productDemands.set(productKey, []);
      }
      productDemands.get(productKey)!.push(saleAny.quantity || 1);
    }
  });

  const classifications: XYZClassification[] = inventory.map((product) => {
    const productKey = (product.name || '').toLowerCase().trim();
    const skuKey = (product.sku || '').toLowerCase().trim();
    const demands = productDemands.get(productKey) || productDemands.get(skuKey) || [0];
    
    // Calculate mean and standard deviation
    const mean = demands.reduce((sum, d) => sum + d, 0) / demands.length;
    const variance =
      demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV)
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

    let classification: 'X' | 'Y' | 'Z' = 'Z';
    if (coefficientOfVariation < 0.25) {
      classification = 'X'; // Low variability
    } else if (coefficientOfVariation < 0.5) {
      classification = 'Y'; // Moderate variability
    } else {
      classification = 'Z'; // High variability
    }

    return {
      product,
      coefficientOfVariation,
      classification,
    };
  });

  return classifications.sort((a, b) => a.coefficientOfVariation - b.coefficientOfVariation);
}

