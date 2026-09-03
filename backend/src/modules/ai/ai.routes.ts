// src/modules/ai/ai.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { aiController } from "./ai.controller";
import { AiParseInvoiceSchema } from "./ai.schema";

const router = Router();

router.use(authMiddleware);

router.post("/parse-invoice", validate(AiParseInvoiceSchema), aiController.parseInvoice);

export default router;

