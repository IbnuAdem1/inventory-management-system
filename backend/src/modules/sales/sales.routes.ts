// src/modules/sales/sales.routes.ts
import { Router } from "express";
import { salesController } from "./sales.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { SaleCreateSchema, SaleReturnSchema } from "./sales.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", salesController.getAll);
router.get("/today", salesController.getToday);
router.get("/:id", salesController.getById);
router.post("/", validate(SaleCreateSchema), salesController.create);
router.post("/:id/return", validate(SaleReturnSchema), salesController.processReturn);

export default router;

