import { Router } from "express";
import { getSalesOrders } from "../controllers/sales.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("salesperson"));

router.get("/orders", getSalesOrders);

export default router;
