import { Request, Response, NextFunction } from "express";
import { activityService } from "./activity.service";

export const activityController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const logs = await activityService.getAll(req.user!, date);
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  },
};
