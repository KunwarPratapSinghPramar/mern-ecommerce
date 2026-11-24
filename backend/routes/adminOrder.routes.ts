import { Router } from "express";
import {
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  cancelAdminOrder,
  markCodOrderPaid,
} from "../controllers/adminOrder.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/", getAllOrders);
router.get("/:id", getAdminOrderById);
router.patch("/:id/status", updateOrderStatus);
router.patch("/:id/cancel", cancelAdminOrder);
router.patch("/:id/mark-cod-paid", markCodOrderPaid);

export default router;
