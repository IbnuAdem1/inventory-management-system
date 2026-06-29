import { Router } from "express";
import { usersController } from "./users.controller";
import { authMiddleware, requireOwner } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  PasswordChangeSchema,
  UserCreateSchema,
  UserUpdateSchema,
} from "./users.schema";

const router = Router();

router.get("/", authMiddleware, requireOwner, usersController.getAll);
router.post("/", authMiddleware, requireOwner, validate(UserCreateSchema), usersController.create);
router.patch("/:id", authMiddleware, requireOwner, validate(UserUpdateSchema), usersController.update);
router.patch("/:id/password", authMiddleware, validate(PasswordChangeSchema), usersController.changePassword);

export default router;
