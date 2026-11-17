import { Router } from "express";
import { uploadProductImages } from "../controllers/upload.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = Router();

router.post(
  "/images",
  protect,
  authorize("admin"),
  upload.array("images", 5),
  uploadProductImages,
);

export default router;
