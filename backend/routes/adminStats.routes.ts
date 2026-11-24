
import { Router } from "express";
import { getAdminStats } from "../controllers/adminStats.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, authorize("admin"), getAdminStats);

export default router;
