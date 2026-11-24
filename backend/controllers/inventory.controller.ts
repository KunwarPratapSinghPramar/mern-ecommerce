import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";

export const adjustProductStock = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();

  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { quantityChange, reason, notes } = req.body;
    const adminId = req.user?.id;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (
      typeof quantityChange !== "number" ||
      !Number.isInteger(quantityChange) ||
      quantityChange === 0
    ) {
      return res.status(400).json({
        message: "Quantity change must be a non-zero whole number",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 200
    ) {
      return res.status(400).json({
        message: "A valid reason is required (maximum 200 characters)",
      });
    }

    if (
      notes !== undefined &&
      (typeof notes !== "string" || notes.length > 500)
    ) {
      return res.status(400).json({
        message: "Notes must be 500 characters or fewer",
      });
    }

    let updatedProduct: InstanceType<typeof Product> | null = null;

    await session.withTransaction(async () => {
      const stockCondition =
        quantityChange < 0 ? { stock: { $gte: Math.abs(quantityChange) } } : {};

      updatedProduct = await Product.findOneAndUpdate(
        // { _id: productId, ...stockCondition },
        {
          _id: productId,
          ...(req.user?.role === "salesperson" ? { owner: adminId } : {}),
          ...stockCondition,
        },
        { $inc: { stock: quantityChange } },
        {
          new: true,
          runValidators: true,
          session,
        },
      );

      if (!updatedProduct) {
        // const exists = await Product.exists({ _id: productId }).session(session,);
        const exists = await Product.exists({
          _id: productId,
          ...(req.user?.role === "salesperson" ? { owner: adminId } : {}),
        }).session(session);

        if (!exists) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        throw new Error("INSUFFICIENT_STOCK");
      }

      const previousStock = updatedProduct.stock - quantityChange;

      await InventoryMovement.create(
        [
          {
            product: updatedProduct._id,
            changedBy: adminId,
            type: "adjustment",
            quantityChange,
            previousStock,
            newStock: updatedProduct.stock,
            reason: reason.trim(),
            notes: notes?.trim(),
          },
        ],
        { session },
      );
    });

    return res.status(200).json({
      message: "Stock and inventory history updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }

    if (message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient stock. Stock cannot become negative.",
      });
    }

    console.error("Stock transaction failed:", error);

    return res.status(500).json({
      message: "Stock transaction failed. No changes were committed.",
    });
  } finally {
    await session.endSession();
  }
};

export const getProductInventoryHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const productId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    // const product = await Product.findById(productId).select("name stock");
    const product = await Product.findOne({
      _id: productId,
      ...(req.user?.role === "salesperson" ? { owner: req.user.id } : {}),
    }).select("name stock");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const movements = await InventoryMovement.find({ product: productId })
      .populate("changedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      product,
      movements,
    });
  } catch (error) {
    console.error("Inventory history error:", error);
    return res.status(500).json({
      message: "Failed to fetch inventory history",
    });
  }
};
