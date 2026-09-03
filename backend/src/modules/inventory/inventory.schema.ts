// src/modules/inventory/inventory.schema.ts
import { z } from "zod";

export const InventoryCreateSchema = z.object({
  name: z.string().min(1, "Part name is required"),
  brand: z.string().min(1, "Brand is required"),
  compatibility: z.string().min(1, "Compatibility is required"),
  category: z.string().optional().default("General"),
  sku: z.string().optional(),
  costPrice: z.number().min(0, "Cost price must be 0 or more"),
  sellingPrice: z.number().positive("Selling price must be greater than 0"),
  stock: z.number().int().min(0, "Stock must be 0 or more"),
  minStock: z.number().int().min(1, "Min stock must be at least 1"),
  registeredDate: z.string().or(z.date()).optional(),
  branchId: z.string().optional(),
});


export const InventoryUpdateSchema = InventoryCreateSchema.partial();

export type InventoryCreateInput = z.infer<typeof InventoryCreateSchema>;
export type InventoryUpdateInput = z.infer<typeof InventoryUpdateSchema>;
