// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { LoginSchema, ChangePasswordSchema } from "./auth.schema";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many login attempts. Please wait a moment and try again." },
  standardHeaders: true,
  legacyHeaders: false,
});


const router = Router();

router.post("/login", loginLimiter, validate(LoginSchema), authController.login);
router.get("/me", authMiddleware, authController.getMe);
router.post("/logout", authMiddleware, authController.logout);
router.patch("/password", authMiddleware, validate(ChangePasswordSchema), authController.changePassword);

export default router;
