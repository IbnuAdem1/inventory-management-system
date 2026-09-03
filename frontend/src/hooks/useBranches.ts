// src/hooks/useBranches.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Branch, StockTransfer } from "@/types";

export function useBranchesQuery() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch<Branch[]>("/branches"),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTransferHistoryQuery(limit = 20, branchId?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["transfers", limit, branchId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (limit) params.set("limit", String(limit));
      if (branchId && branchId !== "all") params.set("branchId", branchId);
      return apiFetch<StockTransfer[]>(`/branches/transfers?${params.toString()}`);
    },
    enabled: isAuthenticated,
  });
}

export function useTransferStockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      inventoryId: string;
      fromBranchId: string;
      toBranchId: string;
      quantity: number;
      notes?: string;
    }) =>
      apiFetch<{ message: string; transfer: StockTransfer }>("/branches/transfer", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
