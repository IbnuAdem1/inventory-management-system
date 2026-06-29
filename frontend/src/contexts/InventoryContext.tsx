import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useCreateInventoryMutation,
  useDeleteInventoryMutation,
  useInventoryQuery,
  useUpdateInventoryMutation,
} from "@/hooks/useInventory";
import { getMarginPercent } from "@/data/mockData";
import type { InventoryItem } from "@/types";

export type NewInventoryItem = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;

interface InventoryContextType {
  inventory: InventoryItem[];
  lowStockItems: InventoryItem[];
  totalItems: number;
  totalStockValue: number;
  isLoading: boolean;
  error: Error | null;
  addItem: (item: NewInventoryItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<NewInventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  decrementStock: (id: string, qty: number) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const inventoryQuery = useInventoryQuery();
  const createInventory = useCreateInventoryMutation();
  const updateInventory = useUpdateInventoryMutation();
  const deleteInventory = useDeleteInventoryMutation();

  const inventory = useMemo(
    () => inventoryQuery.data ?? [],
    [inventoryQuery.data]
  );

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock <= item.minStock),
    [inventory]
  );

  const totalItems = useMemo(
    () => inventory.reduce((sum, item) => sum + item.stock, 0),
    [inventory]
  );

  const totalStockValue = useMemo(
    () => inventory.reduce((sum, item) => sum + item.sellingPrice * item.stock, 0),
    [inventory]
  );

  const addItem = async (item: NewInventoryItem) => {
    await createInventory.mutateAsync(item);
  };

  const updateItem = async (id: string, updates: Partial<NewInventoryItem>) => {
    await updateInventory.mutateAsync({ id, updates });
  };

  const deleteItem = async (id: string) => {
    await deleteInventory.mutateAsync(id);
  };

  const decrementStock = async (id: string, qty: number) => {
    const item = inventory.find((current) => current.id === id);
    if (!item) return;
    await updateItem(id, { stock: Math.max(0, item.stock - qty) });
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        lowStockItems,
        totalItems,
        totalStockValue,
        isLoading: inventoryQuery.isLoading,
        error: inventoryQuery.error,
        addItem,
        updateItem,
        deleteItem,
        decrementStock,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used inside an <InventoryProvider>");
  }
  return context;
}

export { getMarginPercent };
