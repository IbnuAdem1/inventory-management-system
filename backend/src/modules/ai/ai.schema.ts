// src/modules/ai/ai.schema.ts
import { z } from "zod";

export const AiParseInvoiceSchema = z.object({
  invoiceText: z.string().optional().default(""),
  supplierName: z.string().optional(),
  imageBase64: z.string().optional(),
  fileType: z.string().optional(),
  branchId: z.string().optional(),
});

export type AiParseInvoiceInput = z.infer<typeof AiParseInvoiceSchema>;

