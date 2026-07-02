// src/modules/credits/credits.schema.ts
import { z } from "zod";

export const AddCreditPaymentSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["CASH", "TRANSFER"], {
    required_error: "Payment method is required",
  }),
  note: z.string().optional(),
});

export type AddCreditPaymentInput = z.infer<typeof AddCreditPaymentSchema>;
