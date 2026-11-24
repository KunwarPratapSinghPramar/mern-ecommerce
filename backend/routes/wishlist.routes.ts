import { Router } from "express";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} from "../controllers/wishlist.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("user"));

router.get("/", getWishlist);
router.post("/items/:productId", addWishlistItem);
router.delete("/items/:productId", removeWishlistItem);

export default router;
