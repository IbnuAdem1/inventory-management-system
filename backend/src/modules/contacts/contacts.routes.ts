import { Router } from "express";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { contactsController } from "./contacts.controller";
import { ContactCreateSchema, ContactUpdateSchema } from "./contacts.schema";

const router = Router();

router.use(authMiddleware);

router.get("/", contactsController.getAll);
router.get("/:id", contactsController.getById);
router.post("/", requireOwner, validate(ContactCreateSchema), contactsController.create);
router.put("/:id", requireOwner, validate(ContactUpdateSchema), contactsController.update);
router.delete("/:id", requireOwner, contactsController.delete);

export default router;
