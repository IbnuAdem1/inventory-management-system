import { Router } from "express";
import { activityController } from "./activity.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", activityController.getAll);

export default router;
