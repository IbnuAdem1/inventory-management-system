// src/modules/expenses/expenses.service.ts
import { prisma } from "../../lib/prisma";
import { AppError, RequestUser } from "../../types/index";
import { ExpenseCreateInput, ExpenseUpdateInput } from "./expenses.schema";

export const expensesService = {
  async getAll(year: number, month?: number) {
    return prisma.expense.findMany({
      where: {
        year,
        ...(month !== undefined ? { month } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(input: ExpenseCreateInput, user: RequestUser) {
    const expense = await prisma.expense.create({ data: input });

    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Added expense",
        detail: `$${Number(input.amount).toFixed(2)} — ${input.category} (${input.month}/${input.year})`,
        type: "STOCK",
      },
    });

    return expense;
  },

  async update(id: string, input: ExpenseUpdateInput, user: RequestUser) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new AppError("Expense not found", 404);

    const updated = await prisma.expense.update({ where: { id }, data: input });

    const amount = input.amount !== undefined ? Number(input.amount) : Number(existing.amount);
    const category = input.category ?? existing.category;
    const month = input.month ?? existing.month;
    const year = input.year ?? existing.year;

    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Updated expense",
        detail: `$${amount.toFixed(2)} — ${category} (${month}/${year})`,
        type: "STOCK",
      },
    });

    return updated;
  },

  async delete(id: string, user: RequestUser) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new AppError("Expense not found", 404);

    await prisma.expense.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Deleted expense",
        detail: `$${Number(existing.amount).toFixed(2)} — ${existing.category} (${existing.month}/${existing.year})`,
        type: "STOCK",
      },
    });

    return { message: "Expense deleted successfully" };
  },
};
