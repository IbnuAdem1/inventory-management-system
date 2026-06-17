// src/modules/sales/sales.schema.ts
import { z } from "zod";

const SaleItemInputSchema = z.object({
  inventoryId: z.string().uuid("Invalid inventory item ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const SaleCreateSchema = z.object({
  customer: z.string().min(1).default("Walk-in"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CREDIT"], {
    required_error: "Payment method is required",
  }),
  items: z
    .array(SaleItemInputSchema)
    .min(1, "At least one item is required"),
});

export type SaleCreateInput = z.infer<typeof SaleCreateSchema>;
