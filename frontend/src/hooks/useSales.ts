import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { PaymentMethod, Sale } from "@/types";
import type { NewSaleInput } from "@/contexts/SalesContext";

type ApiPaymentMethod = "CASH" | "TRANSFER" | "CREDIT";

// ── API shapes (raw from backend) ──────────────────────────────────────────

interface ApiSaleItem {
  inventoryId: string;
  itemName: string;
  quantity: number;
  unitPrice: string | number;
  amount: string | number;
}

interface ApiBankAccountRef {
  id: string;
  accountHolderName: string;
  bankName: string;
}

interface ApiSale {
  id: string;
  customer: string;
  paymentMethod: ApiPaymentMethod;
  totalAmount: string | number;
  createdAt: string;
  worker?: {
    id: string;
    name: string;
  };
  items: ApiSaleItem[];
  bankAccount?: ApiBankAccountRef | null;
}

const paymentFromApi: Record<ApiPaymentMethod, PaymentMethod> = {
  CASH: "Cash",
  TRANSFER: "Transfer",
  CREDIT: "Credit",
};

const paymentToApi: Record<PaymentMethod, ApiPaymentMethod> = {
  Cash: "CASH",
  Transfer: "TRANSFER",
  Credit: "CREDIT",
};

function mapSale(sale: ApiSale): Sale {
  const firstItem = sale.items[0];

  return {
    id: sale.id,
    date: new Date(sale.createdAt).toISOString().split("T")[0],
    item:
      sale.items.length > 1
        ? `${firstItem?.itemName ?? "Sale"} + ${sale.items.length - 1} more`
        : firstItem?.itemName ?? "Sale",
    inventoryId: firstItem?.inventoryId,
    qty: sale.items.reduce((sum, item) => sum + item.quantity, 0),
    amount: Number(sale.totalAmount),
    payment: paymentFromApi[sale.paymentMethod],
    worker: sale.worker?.name ?? "Unknown",
    customer: sale.customer,
    bankAccount: sale.bankAccount
      ? {
          id: sale.bankAccount.id,
          accountName: sale.bankAccount.accountHolderName,
          bankName: sale.bankAccount.bankName,
        }
      : undefined,
    items: sale.items.map((i) => ({
      itemName: i.itemName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount),
    })),
  };
}

export function useSalesQuery(branchId?: string, startDate?: string, endDate?: string) {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["sales", branchId, startDate, endDate],
    enabled: isAuthenticated,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId && branchId !== "all") params.append("branchId", branchId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const sales = await apiFetch<ApiSale[]>(`/sales${qs}`);
      return sales.map(mapSale);
    },
  });
}

export function useCreateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewSaleInput) =>
      apiFetch<ApiSale>("/sales", {
        method: "POST",
        body: JSON.stringify({
          customer: input.customer,
          paymentMethod: paymentToApi[input.payment],
          ...(input.branchId ? { branchId: input.branchId } : {}),
          ...(input.bankAccountId ? { bankAccountId: input.bankAccountId } : {}),
          items: input.items.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.qty,
          })),
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

