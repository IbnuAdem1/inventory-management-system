// src/types/index.ts
//
// This is the SINGLE SOURCE OF TRUTH for all data shapes (TypeScript interfaces)
// used throughout the entire app.
//
// Think of these as blueprints: they describe WHAT an object looks like,
// not where it comes from or how it's stored.
//
// When you connect a real database (Phase 4), these types will match
// your database columns. If you add a field to the database, add it here first.

// ─────────────────────────────────────────────
// PAYMENT METHODS
// "type" here creates a union — the value must be exactly one of these strings.
// This means: payment: "Cash" is valid, payment: "Cheque" will be a TypeScript error.
// ─────────────────────────────────────────────
export type PaymentMethod = "Cash" | "Transfer" | "Credit";

// ─────────────────────────────────────────────
// ACTIVITY LOG TYPES
// Every action recorded in the Activity page has one of these types.
// Used to determine which icon and color to show.
// ─────────────────────────────────────────────
export type ActivityType = "sale" | "stock" | "auth" | "price" | "credit" | "user";

// ─────────────────────────────────────────────
// WORKER / USER
// A person who works at the shop and has access to the system.
// ─────────────────────────────────────────────
export interface Worker {
  id: string;
  name: string;
  role: "owner" | "worker"; // owner can see cost prices and reports; worker cannot
  email: string;
}

// ─────────────────────────────────────────────
// INVENTORY ITEM
// A spare part in stock. This is the core data model of the app.
// ─────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  compatibility: string; // e.g. "Toyota Camry 2018-2023"
  costPrice: number;     // what you paid the supplier (hidden from workers)
  sellingPrice: number;  // what you charge the customer
  stock: number;         // current units in stock
  minStock: number;      // alert threshold — show warning when stock <= minStock
  createdAt?: string;    // ISO date string, e.g. "2026-06-06T10:30:00Z"
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// SALE
// One sales transaction recorded at the counter.
// ─────────────────────────────────────────────
export type ContactType = "customer" | "supplier";

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  email?: string | null;
  companyName?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscRoutingCode: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sale {
  id: string;
  date: string;            // "YYYY-MM-DD" format
  item: string;            // display name of the part sold
  inventoryId?: string;    // links back to the inventory item (optional for now)
  qty: number;
  amount: number;          // total charged to customer
  payment: PaymentMethod;
  worker: string;          // name of worker who recorded the sale
  customer: string;        // customer name or "Walk-in"
  bankAccount?: {          // only present when paymentMethod is Transfer
    id: string;
    accountName: string;
    bankName: string;
  };
}

// ─────────────────────────────────────────────
// ACTIVITY LOG
// A record of something that happened: a sale, a stock update, a login, etc.
// These are NEVER edited — they are append-only for audit purposes.
// ─────────────────────────────────────────────
export interface ActivityLog {
  id?: string;
  time: string;       // display time, e.g. "10:32 AM"
  worker: string;
  action: string;     // human-readable action, e.g. "Recorded sale"
  detail: string;     // details, e.g. "Brake Pads - Toyota Camry ($85.00)"
  type: ActivityType;
}

// ─────────────────────────────────────────────
// MONTHLY REPORT
// Financial summary for one month — used in the Reports page.
// ─────────────────────────────────────────────
export interface MonthlyReport {
  month: string;    // e.g. "Jan", "Feb"
  revenue: number;
  cost: number;     // cost of goods sold
  expenses: number; // operating expenses (rent, salaries, etc.)
  profit: number;   // revenue - cost - expenses
  totalSales?: number;
}

// ─────────────────────────────────────────────
// EXPENSE
// A single line item in the operating expenses breakdown.
// ─────────────────────────────────────────────
export interface Expense {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

// ─────────────────────────────────────────────
// STAT CARD DATA
// Used to populate the KPI cards on the Dashboard and Reports pages.
// ─────────────────────────────────────────────
export interface StatData {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}
