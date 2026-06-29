import { z } from "zod";

export const ContactTypeSchema = z.enum(["customer", "supplier"]);

export const ContactCreateSchema = z.object({
  type: ContactTypeSchema,
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const ContactUpdateSchema = ContactCreateSchema.partial();

export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;
export type ContactTypeInput = z.infer<typeof ContactTypeSchema>;
