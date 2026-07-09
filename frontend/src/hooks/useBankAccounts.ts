import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ApiBankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  isActive: boolean;
}

export interface BankAccount {
  id: string;
  accountName: string; // accountHolderName mapped to accountName for convenience
  bankName: string;
  accountNumber: string;
}

function mapBankAccount(raw: ApiBankAccount): BankAccount {
  return {
    id: raw.id,
    accountName: raw.accountHolderName,
    bankName: raw.bankName,
    accountNumber: raw.accountNumber,
  };
}

export function useBankAccountsQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["bank-accounts"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await apiFetch<ApiBankAccount[]>("/bank-accounts");
      // Only return active accounts for the dropdown
      return data.filter((a) => a.isActive).map(mapBankAccount);
    },
  });
}
