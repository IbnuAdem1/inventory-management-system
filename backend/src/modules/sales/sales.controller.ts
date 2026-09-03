// src/modules/sales/sales.controller.ts
import { Request, Response, NextFunction } from "express";
import { salesService } from "./sales.service";

export const salesController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const branchId = req.query.branchId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const sales = await salesService.getAll(
        req.user!,
        date,
        branchId,
        startDate,
        endDate
      );
      res.status(200).json(sales);
    } catch (error) {
      next(error);
    }
  },

  async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchId = req.query.branchId as string | undefined;
      const result = await salesService.getToday(req.user!, branchId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await salesService.getById(req.params.id);
      res.status(200).json(sale);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sale = await salesService.create(req.body, req.user!);
      res.status(201).json(sale);
    } catch (error) {
      next(error);
    }
  },

  async processReturn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await salesService.processReturn(req.params.id, req.body, req.user!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};

