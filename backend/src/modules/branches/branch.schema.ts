// src/modules/branches/branch.schema.ts
import { z } from "zod";

export const BranchCreateSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  code: z.string().min(1, "Branch code is required").toUpperCase(),
  address: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const BranchUpdateSchema = BranchCreateSchema.partial();

export const StockTransferSchema = z.object({
  inventoryId: z.string().uuid("Valid part ID required"),
  fromBranchId: z.string().min(1, "Source branch is required"),
  toBranchId: z.string().min(1, "Destination branch is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  notes: z.string().optional(),
});

export type BranchCreateInput = z.infer<typeof BranchCreateSchema>;
export type BranchUpdateInput = z.infer<typeof BranchUpdateSchema>;
export type StockTransferInput = z.infer<typeof StockTransferSchema>;
