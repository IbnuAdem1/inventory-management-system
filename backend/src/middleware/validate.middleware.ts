// src/middleware/validate.middleware.ts
// Higher-order function: takes a Zod schema, returns Express middleware.
// Validates req.body and replaces it with the parsed + typed result.
// On failure: passes a ZodError to the error handler → 400 response.

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
