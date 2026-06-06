// src/contexts/InventoryContext.tsx
//
// Global inventory state. Any page or component can:
//   - Read the full inventory list via useInventory()
//   - Add, update, or delete items
//   - Read derived data (lowStockItems, totalStockValue)
//
// Phase 4 note: replace mockInventory with a useQuery(supabase) call,
// and replace add/update/delete with useMutation calls.

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { mockInventory, getMarginPercent } from "@/data/mockData";
import type { InventoryItem } from "@/types";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

// What callers need to provide when adding a new item (no id yet)
export type NewInventoryItem = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;

interface InventoryContextType {
  inventory: InventoryItem[];
  lowStockItems: InventoryItem[];
  totalItems: number;
  totalStockValue: number;        // sum of (sellingPrice * stock) for all items
  addItem: (item: NewInventoryItem) => void;
  updateItem: (id: number, updates: Partial<NewInventoryItem>) => void;
  deleteItem: (id: number) => void;
  decrementStock: (id: number, qty: number) => void; // used by SalesContext on new sale
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);

  // Auto-increment ID — finds the current max and adds 1
  const nextId = () => Math.max(0, ...inventory.map((i) => i.id)) + 1;

  const addItem = (item: NewInventoryItem) => {
    const now = new Date().toISOString();
    setInventory((prev) => [
      ...prev,
      { ...item, id: nextId(), createdAt: now, updatedAt: now },
    ]);
  };

  const updateItem = (id: number, updates: Partial<NewInventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      )
    );
  };

  const deleteItem = (id: number) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const decrementStock = (id: number, qty: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stock: Math.max(0, item.stock - qty),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  };

  // Derived values — recomputed only when inventory changes
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

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        lowStockItems,
        totalItems,
        totalStockValue,
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

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used inside an <InventoryProvider>");
  }
  return context;
}

// Re-export so consumers don't need a separate import
export { getMarginPercent };
