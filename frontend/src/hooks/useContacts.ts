import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api";
import type { BankAccount, Contact, ContactType } from "@/types";

interface ApiContact {
  id: string;
  type: "CUSTOMER" | "SUPPLIER";
  name: string;
  phone: string;
  email?: string | null;
  companyName?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiBankAccount {
  id: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscRoutingCode: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInput {
  type: ContactType;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  address?: string;
}

export interface BankAccountInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscRoutingCode: string;
  isActive?: boolean;
}

function mapContact(contact: ApiContact): Contact {
  return {
    id: contact.id,
    type: contact.type.toLowerCase() as ContactType,
    name: contact.name,
    phone: contact.phone,
    email: contact.email ?? null,
    companyName: contact.companyName ?? null,
    address: contact.address ?? null,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

function mapBankAccount(account: ApiBankAccount): BankAccount {
  return {
    id: account.id,
    bankName: account.bankName,
    accountHolderName: account.accountHolderName,
    accountNumber: account.accountNumber,
    ifscRoutingCode: account.ifscRoutingCode,
    isActive: account.isActive,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export function useContactsQuery(type: ContactType, enabled = true) {
  return useQuery({
    queryKey: ["contacts", type],
    enabled: enabled && Boolean(getAuthToken()),
    queryFn: async () => {
      const contacts = await apiFetch<ApiContact[]>(`/contacts?type=${type}`);
      return contacts.map(mapContact);
    },
  });
}

export function useBankAccountsQuery() {
  return useQuery({
    queryKey: ["bank-accounts"],
    enabled: Boolean(getAuthToken()),
    queryFn: async () => {
      const accounts = await apiFetch<ApiBankAccount[]>("/bank-accounts");
      return accounts.map(mapBankAccount);
    },
  });
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ContactInput) =>
      apiFetch<ApiContact>("/contacts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ContactInput> }) =>
      apiFetch<ApiContact>(`/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/contacts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useCreateBankAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BankAccountInput) =>
      apiFetch<ApiBankAccount>("/bank-accounts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

export function useUpdateBankAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BankAccountInput> }) =>
      apiFetch<ApiBankAccount>(`/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}

export function useDeleteBankAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ message: string }>(`/bank-accounts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
    },
  });
}
