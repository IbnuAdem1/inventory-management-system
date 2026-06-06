// src/data/mockData.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH FOR ALL MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
//
// Every page and component in the app imports from HERE — not from their
// own local const arrays. This means:
//   - Inventory and LowStockAlerts always show the same data
//   - SalesPage and RecentSalesTable always show the same sales
//   - Fixing one value fixes it everywhere
//
// When you connect a real database (Phase 4 of the Implementation Plan),
// you will DELETE this file and replace each import with an API/query hook.
// Having all mocks centralized here makes that swap trivially easy.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  InventoryItem,
  Sale,
  ActivityLog,
  MonthlyReport,
  Expense,
  Worker,
} from "@/types";

// ─────────────────────────────────────────────
// WORKERS
// ─────────────────────────────────────────────
export const mockWorkers: Worker[] = [
  { id: "w1", name: "Ahmed", role: "worker", email: "ahmed@autopartspro.com" },
  { id: "w2", name: "Yusuf", role: "worker", email: "yusuf@autopartspro.com" },
  { id: "w3", name: "Khalid", role: "worker", email: "khalid@autopartspro.com" },
  { id: "w4", name: "Omar", role: "worker", email: "omar@autopartspro.com" },
  { id: "w5", name: "Faisal", role: "worker", email: "faisal@autopartspro.com" },
];

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
  {
    id: 1,
    name: "Brake Pads",
    brand: "Brembo",
    compatibility: "Toyota Camry 2018-2023",
    costPrice: 35,
    sellingPrice: 85,
    stock: 2,
    minStock: 10,
  },
  {
    id: 2,
    name: "Oil Filter",
    brand: "Bosch",
    compatibility: "Honda Civic 2016-2022",
    costPrice: 8,
    sellingPrice: 24.5,
    stock: 3,
    minStock: 15,
  },
  {
    id: 3,
    name: "Spark Plugs (x4)",
    brand: "NGK",
    compatibility: "Nissan Altima 2019-2023",
    costPrice: 22,
    sellingPrice: 62,
    stock: 45,
    minStock: 20,
  },
  {
    id: 4,
    name: "Air Filter",
    brand: "Mann",
    compatibility: "Ford Focus 2017-2022",
    costPrice: 12,
    sellingPrice: 35,
    stock: 28,
    minStock: 10,
  },
  {
    id: 5,
    name: "Alternator Belt",
    brand: "Gates",
    compatibility: "BMW 320i 2015-2020",
    costPrice: 45,
    sellingPrice: 120,
    stock: 8,
    minStock: 5,
  },
  {
    id: 6,
    name: "Headlight Bulb H4",
    brand: "Philips",
    compatibility: "Universal",
    costPrice: 6,
    sellingPrice: 18,
    stock: 4,
    minStock: 12,
  },
  {
    id: 7,
    name: "Timing Belt Kit",
    brand: "Continental",
    compatibility: "Nissan Altima 2017-2022",
    costPrice: 85,
    sellingPrice: 210,
    stock: 1,
    minStock: 5,
  },
  {
    id: 8,
    name: "Radiator Hose",
    brand: "Dayco",
    compatibility: "Toyota Corolla 2014-2019",
    costPrice: 15,
    sellingPrice: 42,
    stock: 14,
    minStock: 8,
  },
];

// ─────────────────────────────────────────────
// SALES
// Note: dates use today's actual date so "Today's Total" is always correct.
// The getTodayString() helper below returns today's date in YYYY-MM-DD format.
// ─────────────────────────────────────────────
export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const mockSales: Sale[] = [
  {
    id: "S-001",
    date: getTodayString(),
    item: "Brake Pads - Toyota Camry",
    inventoryId: 1,
    qty: 1,
    amount: 85,
    payment: "Cash",
    worker: "Ahmed",
    customer: "Walk-in",
  },
  {
    id: "S-002",
    date: getTodayString(),
    item: "Oil Filter - Honda Civic",
    inventoryId: 2,
    qty: 2,
    amount: 49,
    payment: "Transfer",
    worker: "Yusuf",
    customer: "Ali Hassan",
  },
  {
    id: "S-003",
    date: getTodayString(),
    item: "Spark Plugs (x4) - Nissan",
    inventoryId: 3,
    qty: 1,
    amount: 62,
    payment: "Cash",
    worker: "Khalid",
    customer: "Walk-in",
  },
  {
    id: "S-004",
    date: getTodayString(),
    item: "Air Filter - Ford Focus",
    inventoryId: 4,
    qty: 1,
    amount: 35,
    payment: "Credit",
    worker: "Ahmed",
    customer: "Garage #7",
  },
  {
    id: "S-005",
    date: getTodayString(),
    item: "Alternator Belt - BMW 320i",
    inventoryId: 5,
    qty: 1,
    amount: 120,
    payment: "Transfer",
    worker: "Omar",
    customer: "Walk-in",
  },
  {
    id: "S-006",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // yesterday
    item: "Radiator Hose - Toyota",
    inventoryId: 8,
    qty: 1,
    amount: 42,
    payment: "Cash",
    worker: "Yusuf",
    customer: "Walk-in",
  },
  {
    id: "S-007",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // yesterday
    item: "Headlight Bulb H4",
    inventoryId: 6,
    qty: 2,
    amount: 36,
    payment: "Cash",
    worker: "Ahmed",
    customer: "Faisal Motors",
  },
];

// ─────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────
export const mockActivityLogs: ActivityLog[] = [
  {
    time: "10:32 AM",
    worker: "Ahmed",
    action: "Recorded sale",
    detail: "Brake Pads - Toyota Camry ($85.00)",
    type: "sale",
  },
  {
    time: "10:28 AM",
    worker: "Ahmed",
    action: "Updated stock",
    detail: "Brake Pads - Toyota Camry: 3 → 2",
    type: "stock",
  },
  {
    time: "10:15 AM",
    worker: "Yusuf",
    action: "Recorded sale",
    detail: "Oil Filter - Honda Civic x2 ($49.00)",
    type: "sale",
  },
  {
    time: "09:48 AM",
    worker: "Khalid",
    action: "Recorded sale",
    detail: "Spark Plugs (x4) - Nissan ($62.00)",
    type: "sale",
  },
  {
    time: "09:30 AM",
    worker: "Khalid",
    action: "Updated stock",
    detail: "Added 20 units: Spark Plugs - Universal",
    type: "stock",
  },
  {
    time: "09:22 AM",
    worker: "Ahmed",
    action: "Recorded sale",
    detail: "Air Filter - Ford Focus ($35.00)",
    type: "sale",
  },
  {
    time: "09:05 AM",
    worker: "Omar",
    action: "Recorded sale",
    detail: "Alternator Belt - BMW 320i ($120.00)",
    type: "sale",
  },
  {
    time: "08:55 AM",
    worker: "Omar",
    action: "Logged in",
    detail: "Session started",
    type: "auth",
  },
  {
    time: "08:50 AM",
    worker: "Khalid",
    action: "Logged in",
    detail: "Session started",
    type: "auth",
  },
  {
    time: "08:45 AM",
    worker: "Yusuf",
    action: "Logged in",
    detail: "Session started",
    type: "auth",
  },
  {
    time: "08:30 AM",
    worker: "Ahmed",
    action: "Logged in",
    detail: "Session started",
    type: "auth",
  },
];

// ─────────────────────────────────────────────
// MONTHLY REPORTS
// ─────────────────────────────────────────────
export const mockMonthlyReports: MonthlyReport[] = [
  { month: "Jan", revenue: 18200, cost: 9800, expenses: 4500, profit: 3900 },
  { month: "Feb", revenue: 21500, cost: 11200, expenses: 4500, profit: 5800 },
  { month: "Mar", revenue: 24800, cost: 12900, expenses: 4700, profit: 7200 },
];

// ─────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────
export const mockExpenses: Expense[] = [
  { category: "Rent", amount: 2000 },
  { category: "Salaries", amount: 1500 },
  { category: "Utilities", amount: 350 },
  { category: "Transport", amount: 200 },
  { category: "Misc", amount: 150 },
];

// ─────────────────────────────────────────────
// DERIVED HELPERS
// These functions compute useful things FROM the data above.
// They will still be useful even after you replace mockData with real API calls
// — just pass the real data to them.
// ─────────────────────────────────────────────

/**
 * Returns items where stock is at or below the minStock threshold.
 * Used by: LowStockAlerts component, Dashboard page.
 */
export const getLowStockItems = (inventory: InventoryItem[]): InventoryItem[] => {
  return inventory.filter((item) => item.stock <= item.minStock);
};

/**
 * Returns sales that occurred on a specific date (YYYY-MM-DD format).
 * Defaults to today if no date is provided.
 */
export const getSalesByDate = (
  sales: Sale[],
  date: string = getTodayString()
): Sale[] => {
  return sales.filter((s) => s.date === date);
};

/**
 * Calculates the total revenue for a list of sales.
 */
export const getTotalRevenue = (sales: Sale[]): number => {
  return sales.reduce((sum, s) => sum + s.amount, 0);
};

/**
 * Calculates gross margin percentage for an inventory item.
 * Formula: (sellingPrice - costPrice) / sellingPrice * 100
 */
export const getMarginPercent = (item: InventoryItem): number => {
  if (item.sellingPrice === 0) return 0;
  return ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100;
};
