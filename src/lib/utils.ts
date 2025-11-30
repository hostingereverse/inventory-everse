// Utility functions for formatting, calculations, etc.

import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export function formatCurrency(amount: number | null | undefined, currency = 'INR'): string {
  if (amount == null || isNaN(amount)) return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined, formatStr = 'dd MMM yyyy'): string {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    return format(dateObj, formatStr);
  } catch {
    return '-';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy HH:mm');
}

export function calculateDaysToStockOut(currentStock: number, avgDailySales: number): number {
  if (avgDailySales <= 0) return Infinity;
  return Math.floor(currentStock / avgDailySales);
}

export function calculateInventoryTurnover(costOfGoodsSold: number, averageInventory: number): number {
  if (averageInventory === 0) return 0;
  return costOfGoodsSold / averageInventory;
}

export function calculateDaysOfInventory(turnover: number): number {
  if (turnover === 0) return Infinity;
  return 365 / turnover;
}

export function calculateProfitMargin(sellingPrice: number, costPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = addDays(end, -days);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export function parseCSVRow(row: Record<string, any>, mapping: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(mapping).forEach(([target, source]) => {
    result[target] = row[source] || row[source.toLowerCase()] || null;
  });
  return result;
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function generateSKU(name: string, category?: string): string {
  const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 6);
  const nameCode = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  return `${prefix}-${nameCode}-${timestamp}`;
}

