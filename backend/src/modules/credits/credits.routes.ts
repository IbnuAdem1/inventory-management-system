// src/modules/credits/credits.routes.ts
import { Router } from "express";
import { creditsController } from "./credits.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { AddCreditPaymentSchema } from "./credits.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", creditsController.getAll);
router.get("/:id", creditsController.getById);
router.post("/:id/payments", validate(AddCreditPaymentSchema), creditsController.addPayment);

export default router;
