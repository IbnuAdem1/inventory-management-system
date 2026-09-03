// src/types/index.ts
// Single source of truth for all data shapes in the AutoPartsPro frontend.

export type PaymentMethod = "Cash" | "Transfer" | "Credit";

export type ActivityType =
  | "sale"
  | "stock"
  | "auth"
  | "price"
  | "credit"
  | "user"
  | "transfer"
  | "branch"
  | "expense";

export interface Worker {
  id: string;
  name: string;
  role: "owner" | "worker";
  email: string;
  branchId?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryBranchStock {
  id: string;
  inventoryId: string;
  branchId: string;
  stock: number;
  minStock: number;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  compatibility: string;
  category?: string;
  sku?: string | null;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  registeredDate?: string;
  createdAt?: string;
  updatedAt?: string;
  branchStock?: InventoryBranchStock[];
  branchSpecificStock?: number;
}

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
  date: string;
  item: string;
  inventoryId?: string;
  branchId?: string | null;
  branchName?: string;
  qty: number;
  amount: number;
  discount?: number;
  payment: PaymentMethod;
  worker: string;
  customer: string;
  bankAccount?: {
    id: string;
    accountName: string;
    bankName: string;
  };
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export interface ActivityLog {
  id?: string;
  time: string;
  dateFormatted?: string;
  createdAt?: string;
  worker: string;
  action: string;
  detail: string;
  type: ActivityType;
}


export interface MonthlyReport {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
  totalSales?: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  branchId?: string | null;
  createdAt?: string;
}

export interface Credit {
  id: string;
  saleId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  saleDate: string;
  daysOutstanding: number;
}

export interface CreditPayment {
  id: string;
  creditId: string;
  amount: number;
  paymentMethod: "Cash" | "Transfer";
  note?: string | null;
  recordedBy: string;
  bankAccount?: {
    id: string;
    bankName: string;
    accountHolderName: string;
  } | null;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  inventoryId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  workerId: string;
  notes?: string | null;
  createdAt: string;
  inventory?: { name: string; brand: string; compatibility?: string };
  fromBranch?: { name: string; code: string };
  toBranch?: { name: string; code: string };
  worker?: { name: string };
}

// ─────────────────────────────────────────────
// AI TYPES
// ─────────────────────────────────────────────
export interface AiCopilotResponse {
  reply: string;
  suggestedActions: Array<{
    label: string;
    action: string;
    payload?: unknown;
  }>;
  timestamp: string;
}

export interface AiRestockForecastItem {
  id: string;
  name: string;
  brand: string;
  compatibility: string;
  currentStock: number;
  minStock: number;
  dailyBurnRate: number;
  estimatedDaysRemaining: number;
  status: "CRITICAL" | "LOW" | "HEALTHY" | "OVERSTOCKED";
  suggestedReorder: number;
  estimatedCost: number;
}

export interface AiRestockForecastResponse {
  horizonDays: number;
  totalItemsAnalyzed: number;
  criticalCount: number;
  lowCount: number;
  items: AiRestockForecastItem[];
}

export interface AiParsedInvoiceItem {
  name: string;
  brand: string;
  compatibility: string;
  quantity: number;
  costPrice: number;
  suggestedSellingPrice: number;
  category: string;
}

export interface AiParsedInvoiceResponse {
  supplier: string;
  itemsFound: number;
  items: AiParsedInvoiceItem[];
}

export interface AiDailyInsightsResponse {
  date: string;
  greeting: string;
  todayRevenue: number;
  todaySalesCount: number;
  lowStockCount: number;
  totalDebts: number;
  highlights: string[];
  tipOfTheDay: string;
}
