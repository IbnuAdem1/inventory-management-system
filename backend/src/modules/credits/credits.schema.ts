// src/modules/credits/credits.schema.ts
import { z } from "zod";

export const AddCreditPaymentSchema = z
  .object({
    amount: z
      .number({ required_error: "Amount is required" })
      .positive("Amount must be greater than 0"),
    paymentMethod: z.enum(["CASH", "TRANSFER"], {
      required_error: "Payment method is required",
    }),
    bankAccountId: z.string().uuid("Invalid bank account ID").optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If TRANSFER, bankAccountId is required
    if (data.paymentMethod === "TRANSFER" && !data.bankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankAccountId"],
        message: "Bank account is required when payment method is Transfer",
      });
    }
    // If NOT TRANSFER, bankAccountId must be undefined/null
    if (data.paymentMethod !== "TRANSFER" && data.bankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bankAccountId"],
        message: "Bank account should only be set when payment method is Transfer",
      });
    }
  });

export type AddCreditPaymentInput = z.infer<typeof AddCreditPaymentSchema>;

