// src/modules/inventory/inventory.service.ts
// All inventory business logic — CRUD + role-based field filtering.

import { prisma } from "../../lib/prisma";
import { AppError, RequestUser } from "../../types/index";
import { InventoryCreateInput, InventoryUpdateInput } from "./inventory.schema";

// Workers never see cost prices — strip the field for their role
function stripCostPrice(item: Record<string, unknown>, role: string) {
  if (role === "WORKER") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { costPrice, ...rest } = item;
    return rest;
  }
  return item;
}

export const inventoryService = {
  async getAll(user: RequestUser, search?: string, lowStock?: boolean) {
    const items = await prisma.inventory.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { brand: { contains: search, mode: "insensitive" } },
                  { compatibility: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          lowStock ? { stock: { lte: prisma.inventory.fields.minStock } } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter low stock in application layer (simpler than raw SQL comparison)
    const filtered = lowStock
      ? items.filter((i) => i.stock <= i.minStock)
      : items;

    return filtered.map((item) =>
      stripCostPrice(item as unknown as Record<string, unknown>, user.role)
    );
  },

  async getById(id: string, user: RequestUser) {
    const item = await prisma.inventory.findUnique({ where: { id } });
    if (!item) throw new AppError("Inventory item not found", 404);
    return stripCostPrice(item as unknown as Record<string, unknown>, user.role);
  },

  async create(input: InventoryCreateInput, user: RequestUser) {
    const item = await prisma.inventory.create({ data: input });

    // Log the action
    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Added inventory item",
        detail: `${input.name} — ${input.brand} (${input.stock} units)`,
        type: "STOCK",
      },
    });

    return item;
  },

  async update(id: string, input: InventoryUpdateInput, user: RequestUser) {
    const existing = await prisma.inventory.findUnique({ where: { id } });
    if (!existing) throw new AppError("Inventory item not found", 404);

    const updated = await prisma.inventory.update({
      where: { id },
      data: input,
    });

    // Determine log type — price change vs stock change
    const type =
      input.sellingPrice !== undefined || input.costPrice !== undefined
        ? "PRICE"
        : "STOCK";

    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Updated inventory item",
        detail: `${updated.name} — ${updated.brand}`,
        type,
      },
    });

    return updated;
  },

  async delete(id: string, user: RequestUser) {
    const existing = await prisma.inventory.findUnique({
      where: { id },
      include: { sales: { take: 1 } },
    });
    if (!existing) throw new AppError("Inventory item not found", 404);

    if (existing.sales.length > 0) {
      throw new AppError(
        "Cannot delete item with existing sales records",
        409
      );
    }

    await prisma.inventory.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        workerId: user.id,
        workerName: user.name,
        action: "Deleted inventory item",
        detail: `${existing.name} — ${existing.brand}`,
        type: "STOCK",
      },
    });

    return { message: "Item deleted successfully" };
  },
};
