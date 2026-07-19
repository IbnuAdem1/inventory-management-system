import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";

export const usersController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await usersService.getAll(req.user!);
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.create(req.body, req.user!);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await usersService.updateStatus(
        req.params.id,
        req.body,
        req.user!
      );
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await usersService.resetPassword(
        req.params.id,
        req.body,
        req.user!
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await usersService.delete(req.params.id, req.user!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
