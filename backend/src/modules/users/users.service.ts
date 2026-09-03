import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError, RequestUser } from "../../types/index";
import {
  UserCreateInput,
  UserPasswordResetInput,
  UserStatusInput,
} from "./users.schema";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  branchId: true,
  branch: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  permissions: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function logUserAction(
  actor: RequestUser,
  action: string,
  detail: string
): Promise<void> {
  await prisma.activityLog.create({
    data: {
      workerId: actor.id,
      workerName: actor.name,
      action,
      detail,
      type: "USER",
    },
  });
}

export const usersService = {
  /** List all users except the requesting owner. */
  async getAll(actor: RequestUser) {
    const users = await prisma.user.findMany({
      where: { id: { not: actor.id } },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return users;
  },

  /** Create a new WORKER account with branch & permissions. */
  async create(input: UserCreateInput, actor: RequestUser) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AppError("Email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash,
        role: "WORKER",
        branchId: input.branchId || null,
        permissions: input.permissions || ["sales", "inventory"],
      },
      select: userSelect,
    });

    await logUserAction(
      actor,
      "Added worker",
      `${user.name} (${user.email})`
    );

    return user;
  },

  /** Update worker details, branch assignment, or permissions. */
  async update(id: string, input: any, actor: RequestUser) {
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new AppError("User not found", 404);
    }

    if (target.role === "OWNER") {
      throw new AppError("Cannot modify OWNER accounts", 403);
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.branchId !== undefined) data.branchId = input.branchId || null;
    if (input.permissions !== undefined) data.permissions = input.permissions;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    await logUserAction(
      actor,
      "Updated worker settings",
      `${user.name} (${user.email})`
    );

    return user;
  },

  /** Activate or deactivate a worker. */
  async updateStatus(
    id: string,
    input: UserStatusInput,
    actor: RequestUser
  ) {
    if (id === actor.id) {
      throw new AppError("Cannot deactivate yourself", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new AppError("User not found", 404);
    }

    if (target.role === "OWNER") {
      throw new AppError("Cannot modify OWNER accounts", 403);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: input.isActive },
      select: userSelect,
    });

    await logUserAction(
      actor,
      input.isActive ? "Activated worker" : "Deactivated worker",
      `${user.name} (${user.email})`
    );

    return user;
  },

  /** Owner resets a worker's password (no current password required). */
  async resetPassword(
    id: string,
    input: UserPasswordResetInput,
    actor: RequestUser
  ) {
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new AppError("User not found", 404);
    }

    if (target.role === "OWNER") {
      throw new AppError("Cannot reset OWNER password from here", 403);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await logUserAction(
      actor,
      "Reset worker password",
      `${target.name} (${target.email})`
    );

    return { message: "Password reset successfully" };
  },

  /** Hard-delete a worker account. */
  async delete(id: string, actor: RequestUser) {
    if (id === actor.id) {
      throw new AppError("Cannot delete yourself", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      throw new AppError("User not found", 404);
    }

    if (target.role === "OWNER") {
      throw new AppError("Cannot delete OWNER accounts", 403);
    }

    const [salesCount, paymentsCount] = await Promise.all([
      prisma.sale.count({ where: { workerId: id } }),
      prisma.creditPayment.count({ where: { recordedById: id } }),
    ]);

    if (salesCount > 0 || paymentsCount > 0) {
      throw new AppError(
        "Cannot delete worker with existing sales or payment records. Deactivate them instead.",
        409
      );
    }

    // Remove activity logs attributed to this worker so FK does not block delete.
    // Owner's audit entry for the deletion is written after.
    await prisma.$transaction(
      async (tx) => {
        await tx.activityLog.deleteMany({ where: { workerId: id } });
        await tx.user.delete({ where: { id } });
      },
      { maxWait: 10000, timeout: 15000 }
    );

    await logUserAction(
      actor,
      "Deleted worker",
      `${target.name} (${target.email})`
    );

    return { message: "Worker deleted successfully" };
  },
};
