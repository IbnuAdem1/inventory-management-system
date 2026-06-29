import { prisma } from "../../lib/prisma";
import { AppError } from "../../types/index";
import type { BankAccountCreateInput, BankAccountUpdateInput } from "./bank-accounts.schema";

export const bankAccountsService = {
  async getAll() {
    return prisma.bankAccount.findMany({
      orderBy: [
        { isActive: "desc" },
        { createdAt: "desc" },
      ],
    });
  },

  async getById(id: string) {
    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account) throw new AppError("Bank account not found", 404);
    return account;
  },

  async create(input: BankAccountCreateInput) {
    return prisma.bankAccount.create({
      data: {
        ...input,
        isActive: input.isActive ?? false,
      },
    });
  },

  async update(id: string, input: BankAccountUpdateInput) {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) throw new AppError("Bank account not found", 404);

    return prisma.bankAccount.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string) {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) throw new AppError("Bank account not found", 404);

    await prisma.bankAccount.delete({ where: { id } });
    return { message: "Bank account deleted successfully" };
  },
};
