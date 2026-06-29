import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";

export const usersController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await usersService.getAll();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.update(req.params.id, req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.changePassword(req.params.id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
