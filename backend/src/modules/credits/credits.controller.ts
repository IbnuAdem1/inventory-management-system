// src/modules/credits/credits.controller.ts
import { Request, Response, NextFunction } from "express";
import { creditsService } from "./credits.service";

export const creditsController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credits = await creditsService.getAll(req.user!);
      res.status(200).json(credits);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credit = await creditsService.getById(req.params.id, req.user!);
      res.status(200).json(credit);
    } catch (error) {
      next(error);
    }
  },

  async addPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await creditsService.addPayment(req.params.id, req.body, req.user!);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
