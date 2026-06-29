import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { PaymentMethod, Sale } from "@/types";
import type { NewSaleInput } from "@/contexts/SalesContext";

type ApiPaymentMethod = "CASH" | "TRANSFER" | "CREDIT";

interface ApiSaleItem {
  inventoryId: string;
  itemName: string;
  quantity: number;
  amount: string | number;
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
  };
}

export function useSalesQuery() {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ["sales"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const sales = await apiFetch<ApiSale[]>("/sales");
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
          items: [
            {
              inventoryId: input.inventoryId,
              quantity: input.qty,
            },
          ],
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
