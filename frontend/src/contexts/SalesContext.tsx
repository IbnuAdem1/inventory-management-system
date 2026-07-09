import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getSalesByDate, getTodayString, getTotalRevenue } from "@/data/mockData";
import { useCreateSaleMutation, useSalesQuery } from "@/hooks/useSales";
import type { PaymentMethod, Sale } from "@/types";

export interface NewSaleInput {
  inventoryId: string;
  item: string;
  qty: number;
  amount: number;
  payment: PaymentMethod;
  worker: string;
  customer: string;
  bankAccountId?: string;
}

interface SalesContextType {
  sales: Sale[];
  todaySales: Sale[];
  todayTotal: number;
  totalSalesCount: number;
  isLoading: boolean;
  error: Error | null;
  addSale: (input: NewSaleInput) => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: ReactNode }) {
  const salesQuery = useSalesQuery();
  const createSale = useCreateSaleMutation();
  const sales = useMemo(
    () => salesQuery.data ?? [],
    [salesQuery.data]
  );

  const todaySales = useMemo(
    () => getSalesByDate(sales, getTodayString()),
    [sales]
  );

  const todayTotal = useMemo(
    () => getTotalRevenue(todaySales),
    [todaySales]
  );

  const addSale = async (input: NewSaleInput) => {
    await createSale.mutateAsync(input);
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        todaySales,
        todayTotal,
        totalSalesCount: sales.length,
        isLoading: salesQuery.isLoading,
        error: salesQuery.error,
        addSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales(): SalesContextType {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error("useSales must be used inside a <SalesProvider>");
  }
  return context;
}
