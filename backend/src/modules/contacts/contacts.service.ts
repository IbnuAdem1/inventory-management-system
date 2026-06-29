import { prisma } from "../../lib/prisma";
import { AppError } from "../../types/index";
import type { ContactCreateInput, ContactTypeInput, ContactUpdateInput } from "./contacts.schema";

function toPrismaType(type: ContactTypeInput) {
  return type.toUpperCase() as "CUSTOMER" | "SUPPLIER";
}

export const contactsService = {
  async getAll(type?: ContactTypeInput) {
    return prisma.contact.findMany({
      where: type ? { type: toPrismaType(type) } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new AppError("Contact not found", 404);
    return contact;
  },

  async create(input: ContactCreateInput) {
    return prisma.contact.create({
      data: {
        ...input,
        type: toPrismaType(input.type),
        email: input.email || null,
        companyName: input.companyName || null,
        address: input.address || null,
      },
    });
  },

  async update(id: string, input: ContactUpdateInput) {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new AppError("Contact not found", 404);

    const { type, email, companyName, address, ...rest } = input;

    return prisma.contact.update({
      where: { id },
      data: {
        ...rest,
        ...(type ? { type: toPrismaType(type) } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(companyName !== undefined ? { companyName: companyName || null } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
      },
    });
  },

  async delete(id: string) {
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new AppError("Contact not found", 404);

    await prisma.contact.delete({ where: { id } });
    return { message: "Contact deleted successfully" };
  },
};
