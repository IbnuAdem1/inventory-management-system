import { Router } from "express";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { bankAccountsController } from "./bank-accounts.controller";
import { BankAccountCreateSchema, BankAccountUpdateSchema } from "./bank-accounts.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", bankAccountsController.getAll);
router.get("/:id", bankAccountsController.getById);
router.post("/", validate(BankAccountCreateSchema), bankAccountsController.create);
router.put("/:id", validate(BankAccountUpdateSchema), bankAccountsController.update);
router.delete("/:id", requireOwner, bankAccountsController.delete);

export default router;

