// src/modules/branches/branch.routes.ts
import { Router } from "express";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { branchController } from "./branch.controller";
import { BranchCreateSchema, BranchUpdateSchema, StockTransferSchema } from "./branch.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", branchController.listBranches);
router.get("/transfers", branchController.listTransfers);
router.get("/:id", branchController.getBranch);

router.post("/", requireOwner, validate(BranchCreateSchema), branchController.createBranch);
router.patch("/:id", requireOwner, validate(BranchUpdateSchema), branchController.updateBranch);
router.post("/transfer", validate(StockTransferSchema), branchController.transferStock);

export default router;
