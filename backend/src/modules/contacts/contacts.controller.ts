import { NextFunction, Request, Response } from "express";
import { contactsService } from "./contacts.service";

export const contactsController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as "customer" | "supplier" | undefined;
      const contacts = await contactsService.getAll(type);
      res.status(200).json(contacts);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactsService.getById(req.params.id);
      res.status(200).json(contact);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactsService.create(req.body);
      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactsService.update(req.params.id, req.body);
      res.status(200).json(contact);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await contactsService.delete(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
