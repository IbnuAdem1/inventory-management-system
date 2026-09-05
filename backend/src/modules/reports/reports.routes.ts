// src/modules/reports/reports.routes.ts
import { Router } from "express";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";

import { reportsController } from "./reports.controller";

const router = Router();

router.use(authMiddleware, requireOwner);


router.get("/summary", reportsController.getSummary);
router.get("/top-items", reportsController.getTopItems);
router.get("/payment-breakdown", reportsController.getPaymentBreakdown);
router.get("/branch-comparison", reportsController.getBranchComparison);

export default router;

