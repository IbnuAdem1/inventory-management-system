import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../types/index";
import {
  PasswordChangeInput,
  UserCreateInput,
  UserUpdateInput,
} from "./users.schema";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const usersService = {
  async getAll() {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return users;
  },

  async create(input: UserCreateInput) {
    const email = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      throw new AppError("Email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        role: input.role,
      },
      select: userSelect,
    });

    return user;
  },

  async update(id: string, input: UserUpdateInput) {
    const data = {
      ...input,
      email: input.email?.toLowerCase().trim(),
    };

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return user;
  },

  async changePassword(id: string, input: PasswordChangeInput) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);

    if (!isValid) {
      throw new AppError("Current password is incorrect", 401);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { message: "Password changed successfully" };
  },
};
