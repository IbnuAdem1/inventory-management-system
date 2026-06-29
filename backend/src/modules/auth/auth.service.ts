// src/modules/auth/auth.service.ts
// All authentication business logic lives here.

import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { AppError } from "../../types/index";
import { LoginInput } from "./auth.schema";

export const authService = {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    // Always compare — prevents timing attacks that reveal if email exists
    const dummyHash =
      "$2a$12$placeholderhashthatisexactly60charslong1234567890abcde";
    const passwordHash = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !isValid || !user.isActive) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) throw new AppError("User not found", 404);
    return user;
  },
};
