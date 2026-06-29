// src/modules/reports/reports.controller.ts
import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";

export const reportsController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await reportsService.getSummary(year);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getTopItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const data = await reportsService.getTopItems(limit);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getPaymentBreakdown(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getPaymentBreakdown();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
