// src/contexts/SalesContext.tsx
//
// Global sales state. Any page or component can:
//   - Read all sales via useSales()
//   - Add a new sale (which also decrements inventory via InventoryContext)
//   - Read derived data: today's sales, today's total, total sale count
//
// Phase 4 note: replace mockSales with a useQuery(supabase) call,
// and replace addSale with a useMutation call.

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { mockSales, getTodayString, getTotalRevenue, getSalesByDate } from "@/data/mockData";
import { useInventory } from "@/contexts/InventoryContext";
import type { Sale, PaymentMethod } from "@/types";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

// What the caller provides when recording a new sale
export interface NewSaleInput {
  inventoryId: number;
  item: string;
  qty: number;
  amount: number;
  payment: PaymentMethod;
  worker: string;
  customer: string;
}

interface SalesContextType {
  sales: Sale[];
  todaySales: Sale[];
  todayTotal: number;
  totalSalesCount: number;
  addSale: (input: NewSaleInput) => void;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const SalesContext = createContext<SalesContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function SalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<Sale[]>(mockSales);
  const { decrementStock } = useInventory();

  const addSale = (input: NewSaleInput) => {
    const newSale: Sale = {
      id: `S-${String(sales.length + 1).padStart(3, "0")}`,
      date: getTodayString(),
      item: input.item,
      inventoryId: input.inventoryId,
      qty: input.qty,
      amount: input.amount,
      payment: input.payment,
      worker: input.worker,
      customer: input.customer,
    };

    setSales((prev) => [newSale, ...prev]);

    // Keep inventory in sync — reduce stock for the sold item
    decrementStock(input.inventoryId, input.qty);
  };

  // Derived values
  const todaySales = useMemo(
    () => getSalesByDate(sales, getTodayString()),
    [sales]
  );

  const todayTotal = useMemo(
    () => getTotalRevenue(todaySales),
    [todaySales]
  );

  const totalSalesCount = sales.length;

  return (
    <SalesContext.Provider
      value={{
        sales,
        todaySales,
        todayTotal,
        totalSalesCount,
        addSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useSales(): SalesContextType {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error("useSales must be used inside a <SalesProvider>");
  }
  return context;
}
