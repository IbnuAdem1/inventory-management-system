import { Router } from "express";
import { usersController } from "./users.controller";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  UserCreateSchema,
  UserPasswordResetSchema,
  UserStatusSchema,
} from "./users.schema";

const router = Router();

// All user-management endpoints are OWNER only
router.use(authMiddleware, requireOwner);

router.get("/", usersController.getAll);
router.post("/", validate(UserCreateSchema), usersController.create);
router.patch(
  "/:id/status",
  validate(UserStatusSchema),
  usersController.updateStatus
);
router.patch(
  "/:id/password",
  validate(UserPasswordResetSchema),
  usersController.resetPassword
);
router.delete("/:id", usersController.delete);

export default router;
