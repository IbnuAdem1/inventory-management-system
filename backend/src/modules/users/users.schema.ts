import { z } from "zod";

export const UserCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const UserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const UserPasswordResetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserStatusInput = z.infer<typeof UserStatusSchema>;
export type UserPasswordResetInput = z.infer<typeof UserPasswordResetSchema>;
