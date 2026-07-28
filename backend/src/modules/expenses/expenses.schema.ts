// src/modules/expenses/expenses.schema.ts
import { z } from "zod";

export const ExpenseCreateSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const ExpenseUpdateSchema = ExpenseCreateSchema.partial();

export type ExpenseCreateInput = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof ExpenseUpdateSchema>;
