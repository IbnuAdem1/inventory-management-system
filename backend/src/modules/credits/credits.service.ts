// src/modules/credits/credits.service.ts
// Business logic for credit management.
// Credits are auto-created when a sale uses CREDIT payment method.
// Payments are added incrementally; status updates automatically.

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError, RequestUser } from "../../types/index";
import { AddCreditPaymentInput } from "./credits.schema";

export const creditsService = {
  async getAll(user: RequestUser) {
    const where =
      user.role === "WORKER"
        ? { sale: { workerId: user.id } } // workers see only credits from their own sales
        : {};

    return prisma.credit.findMany({
      where,
      include: {
        sale: {
          include: {
            items: {
              select: { itemName: true, quantity: true },
            },
          },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
            bankAccount: { select: { id: true, accountHolderName: true, bankName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string, user: RequestUser) {
    const credit = await prisma.credit.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            items: {
              select: { itemName: true, quantity: true },
            },
          },
        },
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
            bankAccount: { select: { id: true, accountHolderName: true, bankName: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!credit) throw new AppError("Credit not found", 404);

    // Workers can only view credits from their own sales
    if (user.role === "WORKER" && credit.sale.workerId !== user.id) {
      throw new AppError("Forbidden", 403);
    }

    return credit;
  },

  async addPayment(id: string, input: AddCreditPaymentInput, user: RequestUser) {
    return prisma.$transaction(async (tx) => {
      // Lock the credit row for update
      const credit = await tx.credit.findUnique({ where: { id } });
      if (!credit) throw new AppError("Credit not found", 404);

      // Workers can only pay credits from their own sales
      if (user.role === "WORKER") {
        const sale = await tx.sale.findUnique({ where: { id: credit.saleId } });
        if (sale?.workerId !== user.id) throw new AppError("Forbidden", 403);
      }

      if (credit.status === "PAID") {
        throw new AppError("This credit is already fully paid", 409);
      }

      const remaining = new Prisma.Decimal(credit.totalAmount).sub(
        new Prisma.Decimal(credit.paidAmount)
      );

      const paymentAmount = new Prisma.Decimal(input.amount);

      if (paymentAmount.lte(0)) {
        throw new AppError("Payment amount must be greater than 0", 400);
      }

      if (paymentAmount.gt(remaining)) {
        throw new AppError(
          `Payment amount $${paymentAmount.toFixed(2)} exceeds remaining balance $${remaining.toFixed(2)}`,
          400
        );
      }

      // Create the payment record
      const payment = await tx.creditPayment.create({
        data: {
          creditId: id,
          amount: paymentAmount,
          paymentMethod: input.paymentMethod,
          note: input.note ?? null,
          bankAccountId: input.paymentMethod === "TRANSFER" ? input.bankAccountId : null,
          recordedById: user.id,
        },
      });

      // Update credit totals and status
      const newPaidAmount = new Prisma.Decimal(credit.paidAmount).add(paymentAmount);
      const newStatus = newPaidAmount.gte(new Prisma.Decimal(credit.totalAmount))
        ? "PAID"
        : "PARTIAL";

      const updatedCredit = await tx.credit.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: {
          payments: {
            include: {
              recordedBy: { select: { id: true, name: true } },
              bankAccount: { select: { id: true, accountHolderName: true, bankName: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          sale: {
            include: {
              items: { select: { itemName: true, quantity: true } },
            },
          },
        },
      });

      // Write activity log
      await tx.activityLog.create({
        data: {
          workerId: user.id,
          workerName: user.name,
          action: "Recorded credit payment",
          detail: `$${paymentAmount.toFixed(2)} (${input.paymentMethod}) for ${credit.customerName} — balance remaining: $${remaining.sub(paymentAmount).toFixed(2)}`,
          type: "CREDIT",
        },
      });

      return { credit: updatedCredit, payment };
    }, {
      maxWait: 10000,
      timeout: 15000,
    });
  },
};
