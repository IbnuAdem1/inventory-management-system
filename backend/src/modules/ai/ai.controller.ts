// src/modules/ai/ai.controller.ts
import { Request, Response, NextFunction } from "express";
import { aiService } from "./ai.service";
import { AiParseInvoiceInput } from "./ai.schema";

export const aiController = {
  async parseInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = await aiService.parseInvoice(
        req.body as AiParseInvoiceInput
      );
      res.json(parsed);
    } catch (err) {
      next(err);
    }
  },
};

