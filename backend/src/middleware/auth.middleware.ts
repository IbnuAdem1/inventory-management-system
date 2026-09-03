// src/middleware/auth.middleware.ts
// Verifies JWT on every protected route.
// Attaches the decoded user to req.user.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError, RequestUser } from "../types/index";

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "WORKER";
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    // Try checking user in DB; if DB network times out, rely on valid signed JWT
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      if (user && !user.isActive) {
        throw new AppError("Account deactivated", 401);
      }

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as RequestUser["role"],
        };
        return next();
      }
    } catch (dbErr) {
      if (dbErr instanceof AppError) throw dbErr;
      console.warn("DB user verification network fallback:", dbErr);
    }

    // Fallback to verified JWT payload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware that requires OWNER role — use after authMiddleware
export const requireOwner = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "OWNER") {
    return next(new AppError("Forbidden: owner access required", 403));
  }
  next();
};
