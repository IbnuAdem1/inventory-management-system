// src/modules/branches/branch.controller.ts
import { Request, Response, NextFunction } from "express";
import { branchService } from "./branch.service";
import { BranchCreateInput, BranchUpdateInput, StockTransferInput } from "./branch.schema";

export const branchController = {
  async listBranches(_req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await branchService.getAllBranches();
      res.json(branches);
    } catch (err) {
      next(err);
    }
  },

  async getBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.getById(req.params.id);
      res.json(branch);
    } catch (err) {
      next(err);
    }
  },

  async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.create(req.body as BranchCreateInput, req.user!);
      res.status(201).json(branch);
    } catch (err) {
      next(err);
    }
  },

  async updateBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await branchService.update(req.params.id, req.body as BranchUpdateInput, req.user!);
      res.json(branch);
    } catch (err) {
      next(err);
    }
  },

  async transferStock(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await branchService.transferStock(req.body as StockTransferInput, req.user!);
      res.status(201).json({
        message: "Stock transferred successfully",
        transfer,
      });
    } catch (err) {
      next(err);
    }
  },

  async listTransfers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const branchId = req.query.branchId as string | undefined;
      const transfers = await branchService.getTransferHistory(limit, branchId);
      res.json(transfers);
    } catch (err) {
      next(err);
    }
  },
};
