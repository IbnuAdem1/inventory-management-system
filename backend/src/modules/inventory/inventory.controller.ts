// src/modules/inventory/inventory.controller.ts
import { Request, Response, NextFunction } from "express";
import { inventoryService } from "./inventory.service";

export const inventoryController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query.search as string | undefined;
      const lowStock = req.query.lowStock === "true";
      const branchId = req.query.branchId as string | undefined;
      const category = req.query.category as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const items = await inventoryService.getAll(
        req.user!,
        search,
        lowStock,
        branchId,
        category,
        startDate,
        endDate
      );
      res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.getById(req.params.id, req.user!);
      res.status(200).json(item);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.create(req.body, req.user!);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await inventoryService.update(req.params.id, req.body, req.user!);
      res.status(200).json(item);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await inventoryService.delete(req.params.id, req.user!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
