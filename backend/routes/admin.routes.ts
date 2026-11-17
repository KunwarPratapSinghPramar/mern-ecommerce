import { Router, Request, Response } from "express";
import User, { UserRole } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("admin"));

// View all users
router.get("/users", async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

// Change user role
router.patch("/users/:id/role", async (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    const allowedRoles: UserRole[] = ["admin", "salesperson", "user"];

    if (!allowedRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
      return;
    }

    if (req.params.id === req.user?.id) {
      res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User role updated.",
      user,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to update role.",
    });
  }
});

export default router;
