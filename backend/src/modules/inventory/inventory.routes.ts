// src/modules/inventory/inventory.routes.ts
import { Router } from "express";
import { inventoryController } from "./inventory.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

import { validate } from "../../middleware/validate.middleware";
import { InventoryCreateSchema, InventoryUpdateSchema } from "./inventory.schema";

const router = Router();

// All inventory routes require login
router.use(authMiddleware);

router.get("/", inventoryController.getAll);
router.get("/:id", inventoryController.getById);

// Write operations — staff with inventory privileges / owner
router.post("/", validate(InventoryCreateSchema), inventoryController.create);
router.patch("/:id", validate(InventoryUpdateSchema), inventoryController.update);
router.delete("/:id", inventoryController.delete);

export default router;

