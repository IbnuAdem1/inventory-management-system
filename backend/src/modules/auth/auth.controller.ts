// src/modules/auth/auth.controller.ts
// Handles HTTP layer — extracts request data, calls service, sends response.

import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  logout(_req: Request, res: Response): void {
    // JWT is stateless — client discards the token.
    // This endpoint exists to log the action and give the frontend
    // a clean endpoint to call.
    res.status(200).json({ message: "Logged out successfully" });
  },
};
