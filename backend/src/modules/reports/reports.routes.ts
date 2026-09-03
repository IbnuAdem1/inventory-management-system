// src/modules/reports/reports.routes.ts
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";

import { reportsController } from "./reports.controller";

const router = Router();

router.use(authMiddleware);

router.get("/summary", reportsController.getSummary);
router.get("/top-items", reportsController.getTopItems);
router.get("/payment-breakdown", reportsController.getPaymentBreakdown);
router.get("/branch-comparison", reportsController.getBranchComparison);

export default router;

