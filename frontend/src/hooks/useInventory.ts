import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import type { InventoryItem } from "@/types";
import type { NewInventoryItem } from "@/contexts/InventoryContext";

interface ApiInventoryItem {
  id: string;
  name: string;
  brand: string;
  compatibility: string;
  costPrice?: string | number;
  sellingPrice: string | number;
  stock: number;
  minStock: number;
  createdAt?: string;
  updatedAt?: string;
}

function mapInventoryItem(item: ApiInventoryItem): InventoryItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    compatibility: item.compatibility,
    costPrice: Number(item.costPrice ?? 0),
    sellingPrice: Number(item.sellingPrice),
    stock: item.stock,
    minStock: item.minStock,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export function useInventoryQuery(branchId?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["inventory", branchId],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId && branchId !== "all") params.append("branchId", branchId);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const items = await apiFetch<ApiInventoryItem[]>(`/inventory${qs}`);
      return items.map(mapInventoryItem);
    },
  });
}

export function useCreateInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewInventoryItem & { branchId?: string }) =>
      apiFetch<ApiInventoryItem>("/inventory", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}


export function useUpdateInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NewInventoryItem> }) =>
      apiFetch<ApiInventoryItem>(`/inventory/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/inventory/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
