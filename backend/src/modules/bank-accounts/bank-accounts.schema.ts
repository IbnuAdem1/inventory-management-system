import { z } from "zod";

export const BankAccountCreateSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  ifscRoutingCode: z.string().min(1, "IFSC/Routing code is required"),
  isActive: z.boolean().optional(),
});

export const BankAccountUpdateSchema = BankAccountCreateSchema.partial();

export type BankAccountCreateInput = z.infer<typeof BankAccountCreateSchema>;
export type BankAccountUpdateInput = z.infer<typeof BankAccountUpdateSchema>;
