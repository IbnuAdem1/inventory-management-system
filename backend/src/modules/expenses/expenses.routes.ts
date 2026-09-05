// src/modules/expenses/expenses.routes.ts
import { Router } from "express";
import { expensesController } from "./expenses.controller";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";

import { validate } from "../../middleware/validate.middleware";
import { ExpenseCreateSchema, ExpenseUpdateSchema } from "./expenses.schema";

const router = Router();

// All expense routes: OWNER only
router.use(authMiddleware, requireOwner);


router.get("/", expensesController.getAll);
router.post("/", validate(ExpenseCreateSchema), expensesController.create);
router.patch("/:id", validate(ExpenseUpdateSchema), expensesController.update);
router.delete("/:id", expensesController.delete);


export default router;
