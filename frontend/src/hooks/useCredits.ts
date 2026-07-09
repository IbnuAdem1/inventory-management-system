import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// ── API shapes (raw from backend) ──────────────────────────────────────────

interface ApiCreditPayment {
  id: string;
  amount: string | number;
  paymentMethod: "CASH" | "TRANSFER";
  note?: string | null;
  createdAt: string;
  recordedBy: { id: string; name: string };
  bankAccount?: { id: string; accountHolderName: string; bankName: string } | null;
}

interface ApiCredit {
  id: string;
  saleId: string;
  customerName: string;
  totalAmount: string | number;
  paidAmount: string | number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  payments: ApiCreditPayment[];
  sale: {
    items: { itemName: string; quantity: number }[];
  };
}

// ── Frontend types ──────────────────────────────────────────────────────────

export interface CreditPayment {
  id: string;
  amount: number;
  paymentMethod: "Cash" | "Transfer";
  note?: string;
  recordedBy: string;
  bankAccountName?: string; // "AccountName — BankName" if Transfer
  createdAt: string;
}

export interface Credit {
  id: string;
  saleId: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  payments: CreditPayment[];
  createdAt: string;
  sale: {
    items: { itemName: string; quantity: number }[];
  };
}

export interface AddPaymentInput {
  amount: number;
  paymentMethod: "CASH" | "TRANSFER";
  bankAccountId?: string;
  note?: string;
}

// ── Mappers ─────────────────────────────────────────────────────────────────

const pmFromApi = (pm: "CASH" | "TRANSFER"): "Cash" | "Transfer" =>
  pm === "CASH" ? "Cash" : "Transfer";

function mapCredit(raw: ApiCredit): Credit {
  const total = Number(raw.totalAmount);
  const paid = Number(raw.paidAmount);
  return {
    id: raw.id,
    saleId: raw.saleId,
    customerName: raw.customerName,
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: parseFloat((total - paid).toFixed(2)),
    status: raw.status,
    payments: raw.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentMethod: pmFromApi(p.paymentMethod),
      note: p.note ?? undefined,
      recordedBy: p.recordedBy.name,
      bankAccountName: p.bankAccount
        ? `${p.bankAccount.accountHolderName} — ${p.bankAccount.bankName}`
        : undefined,
      createdAt: p.createdAt,
    })),
    createdAt: raw.createdAt,
    sale: raw.sale,
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useCreditsQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["credits"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await apiFetch<ApiCredit[]>("/credits");
      return data.map(mapCredit);
    },
  });
}

export function useAddCreditPaymentMutation(creditId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddPaymentInput) =>
      apiFetch<{ credit: ApiCredit; payment: ApiCreditPayment }>(
        `/credits/${creditId}/payments`,
        {
          method: "POST",
          body: JSON.stringify(input),
        }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["credits"] });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
