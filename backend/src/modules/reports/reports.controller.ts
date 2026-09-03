// src/modules/reports/reports.controller.ts
import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";

export const reportsController = {
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const branchId = req.query.branchId as string | undefined;
      const data = await reportsService.getSummary(year, branchId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getTopItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const branchId = req.query.branchId as string | undefined;
      const data = await reportsService.getTopItems(limit, branchId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getPaymentBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = req.query.branchId as string | undefined;
      const data = await reportsService.getPaymentBreakdown(branchId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },

  async getBranchComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await reportsService.getBranchComparison(year);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  },
};
