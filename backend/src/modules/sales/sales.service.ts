// src/modules/sales/sales.service.ts
// Core business logic for sales.
// createSale uses a Prisma transaction — either everything
// succeeds (sale + all stock decrements) or nothing does.

import { prisma } from "../../lib/prisma";
import { AppError, RequestUser } from "../../types/index";
import { SaleCreateInput } from "./sales.schema";

export const salesService = {
  async getAll(user: RequestUser, date?: string) {
    const where =
      user.role === "WORKER"
        ? { workerId: user.id } // workers see only their own sales
        : {};

    const sales = await prisma.sale.findMany({
      where: date
        ? {
            ...where,
            createdAt: {
              gte: new Date(`${date}T00:00:00.000Z`),
              lte: new Date(`${date}T23:59:59.999Z`),
            },
          }
        : where,
      include: {
        worker: { select: { id: true, name: true } },
        items: {
          include: {
            inventory: { select: { id: true, name: true, brand: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sales;
  },

  async getToday(user: RequestUser) {
    const today = new Date().toISOString().split("T")[0];
    const sales = await salesService.getAll(user, today);

    const total = sales.reduce(
      (sum, s) => sum + Number(s.totalAmount),
      0
    );

    return { sales, total, count: sales.length };
  },

  async getById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        worker: { select: { id: true, name: true } },
        items: {
          include: {
            inventory: { select: { id: true, name: true, brand: true } },
          },
        },
      },
    });
    if (!sale) throw new AppError("Sale not found", 404);
    return sale;
  },

  async create(input: SaleCreateInput, user: RequestUser) {
    // Use a transaction: all-or-nothing
    // 1. Validate all items have enough stock
    // 2. Create the Sale record
    // 3. Create all SaleItem records
    // 4. Decrement stock for each item
    // 5. Write activity log

    const result = await prisma.$transaction(async (tx) => {
      // Step 1 — fetch all inventory items and validate stock
      const inventoryItems = await Promise.all(
        input.items.map(async (lineItem) => {
          const inv = await tx.inventory.findUnique({
            where: { id: lineItem.inventoryId },
          });

          if (!inv) {
            throw new AppError(
              `Inventory item ${lineItem.inventoryId} not found`,
              404
            );
          }

          if (inv.stock < lineItem.quantity) {
            throw new AppError(
              `Insufficient stock for "${inv.name}". Available: ${inv.stock}, requested: ${lineItem.quantity}`,
              409
            );
          }

          return { inv, quantity: lineItem.quantity };
        })
      );

      // Step 2 — compute total
      const totalAmount = inventoryItems.reduce(
        (sum, { inv, quantity }) => sum + Number(inv.sellingPrice) * quantity,
        0
      );

      // Step 3 — create the Sale header
      const sale = await tx.sale.create({
        data: {
          workerId: user.id,
          customer: input.customer,
          paymentMethod: input.paymentMethod,
          totalAmount,
          items: {
            create: inventoryItems.map(({ inv, quantity }) => ({
              inventoryId: inv.id,
              itemName: `${inv.name} — ${inv.brand}`,
              unitPrice: inv.sellingPrice,
              quantity,
              amount: Number(inv.sellingPrice) * quantity,
            })),
          },
        },
        include: {
          items: true,
          worker: { select: { id: true, name: true } },
        },
      });

      // Step 4 — decrement stock for each item
      await Promise.all(
        inventoryItems.map(({ inv, quantity }) =>
          tx.inventory.update({
            where: { id: inv.id },
            data: { stock: { decrement: quantity } },
          })
        )
      );

      // Step 5 — write activity log
      const itemsSummary = inventoryItems
        .map(({ inv, quantity }) => `${inv.name} x${quantity}`)
        .join(", ");

      await tx.activityLog.create({
        data: {
          workerId: user.id,
          workerName: user.name,
          action: "Recorded sale",
          detail: `${itemsSummary} — $${totalAmount.toFixed(2)} (${input.paymentMethod})`,
          type: "SALE",
        },
      });

      return sale;
    });

    return result;
  },
};
