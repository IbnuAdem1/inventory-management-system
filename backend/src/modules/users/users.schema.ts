import { z } from "zod";

export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchId: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional().default(["sales", "inventory"]),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  branchId: z.string().nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

export const UserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const UserPasswordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type UserStatusInput = z.infer<typeof UserStatusSchema>;
export type UserPasswordResetInput = z.infer<typeof UserPasswordResetSchema>;

