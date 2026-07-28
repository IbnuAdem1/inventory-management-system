// src/modules/expenses/expenses.controller.ts
import { Request, Response, NextFunction } from "express";
import { expensesService } from "./expenses.service";

export const expensesController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string);
      if (isNaN(year)) {
        res.status(400).json({ message: "Query param 'year' is required and must be a number" });
        return;
      }
      const monthRaw = req.query.month as string | undefined;
      const month = monthRaw !== undefined ? parseInt(monthRaw) : undefined;
      const expenses = await expensesService.getAll(year, month);
      res.status(200).json(expenses);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expensesService.create(req.body, req.user!);
      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expensesService.update(req.params.id, req.body, req.user!);
      res.status(200).json(expense);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await expensesService.delete(req.params.id, req.user!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
