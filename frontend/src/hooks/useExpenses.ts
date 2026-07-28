// src/hooks/useExpenses.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Expense } from "@/types";

interface ApiExpense {
  id: string;
  category: string;
  amount: string | number;
  month: number;
  year: number;
  createdAt: string;
}

function mapExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    month: e.month,
    year: e.year,
    createdAt: e.createdAt,
  };
}

export function useExpensesQuery(year: number, month?: number) {
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams({ year: String(year) });
  if (month !== undefined) params.set("month", String(month));

  return useQuery({
    queryKey: ["expenses", year, month],
    enabled: isAuthenticated,
    queryFn: async () => {
      const items = await apiFetch<ApiExpense[]>(`/expenses?${params.toString()}`);
      return items.map(mapExpense);
    },
  });
}

export interface ExpenseCreateInput {
  category: string;
  amount: number;
  month: number;
  year: number;
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseCreateInput) =>
      apiFetch<ApiExpense>("/expenses", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ExpenseCreateInput> }) =>
      apiFetch<ApiExpense>(`/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/expenses/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
