// src/middleware/error.middleware.ts
// Global error handler — must be registered LAST in app.ts.
// Catches every error thrown anywhere in the app.
// Logs full details server-side, sends sanitized JSON to client.

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../types/index";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Always log the full error server-side
  console.error("[ERROR]", err);

  // Zod validation error → 400 with field-level messages
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: err.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Our custom AppError → use the status code we set
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // Prisma known errors
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err
  ) {
    const prismaErr = err as { code: string; meta?: { target?: string[] } };

    if (prismaErr.code === "P2025") {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
    if (prismaErr.code === "P2002") {
      const field = prismaErr.meta?.target?.[0] ?? "field";
      res.status(409).json({ message: `${field} already exists` });
      return;
    }
  }

  // Unknown error → 500, never leak details
  res.status(500).json({ message: "Internal server error" });
};
