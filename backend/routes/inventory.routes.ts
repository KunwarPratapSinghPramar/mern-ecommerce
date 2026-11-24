import { Router } from "express";
import {
  adjustProductStock,
  getProductInventoryHistory,
} from "../controllers/inventory.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("admin", "salesperson"));

router.patch("/:id/adjust", adjustProductStock);
router.get("/:id/history", getProductInventoryHistory);

export default router;
