import { NextFunction, Request, Response } from "express";
import { bankAccountsService } from "./bank-accounts.service";

export const bankAccountsController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accounts = await bankAccountsService.getAll();
      res.status(200).json(accounts);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await bankAccountsService.getById(req.params.id);
      res.status(200).json(account);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await bankAccountsService.create(req.body);
      res.status(201).json(account);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const account = await bankAccountsService.update(req.params.id, req.body);
      res.status(200).json(account);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await bankAccountsService.delete(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
