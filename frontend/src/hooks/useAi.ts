// src/hooks/useAi.ts
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { AiParsedInvoiceResponse } from "@/types";

export function useAiParseInvoiceMutation() {
  return useMutation({
    mutationFn: (input: {
      invoiceText?: string;
      supplierName?: string;
      imageBase64?: string;
      fileType?: string;
      branchId?: string;
    }) =>
      apiFetch<AiParsedInvoiceResponse>("/ai/parse-invoice", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

