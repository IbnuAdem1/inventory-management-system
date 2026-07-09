// src/modules/sales/sales.schema.ts
import { z } from "zod";

const SaleItemInputSchema = z.object({
  inventoryId: z.string().uuid("Invalid inventory item ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const SaleCreateSchema = z
  .object({
    customer: z.string().min(1).default("Walk-in"),
    paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT"], {
      required_error: "Payment method is required",
    }),
    bankAccountId: z.string().uuid("Invalid bank account ID").optional(),
    items: z
      .array(SaleItemInputSchema)
      .min(1, "At least one item is required"),
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

export type SaleCreateInput = z.infer<typeof SaleCreateSchema>;

