import { Router } from "express";
import { reportsController } from "./reports.controller";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware, requireOwner);

router.get("/summary", reportsController.getSummary);
router.get("/top-items", reportsController.getTopItems);
router.get("/payment-breakdown", reportsController.getPaymentBreakdown);

export default router;
