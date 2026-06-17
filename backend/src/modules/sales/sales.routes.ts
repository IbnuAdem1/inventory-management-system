// src/modules/sales/sales.routes.ts
import { Router } from "express";
import { salesController } from "./sales.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { SaleCreateSchema } from "./sales.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", salesController.getAll);
router.get("/today", salesController.getToday);
router.get("/:id", salesController.getById);
router.post("/", validate(SaleCreateSchema), salesController.create);

export default router;
