import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
} from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public route: Razorpay authenticates this request using its webhook signature.
router.post("/razorpay/webhook", handleRazorpayWebhook);

// Customer routes: require a valid login.
router.use(protect);

router.post("/razorpay/create", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);

export default router;
