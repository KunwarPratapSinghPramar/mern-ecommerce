import { Request, Response } from "express";
import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product, { IProduct } from "../models/Product.js";

const getPopulatedWishlist = async (userId: string) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate<{
    items: IProduct[];
  }>("items");

  return {
    items: (wishlist?.items ?? []).filter(Boolean),
  };
};

// GET /api/wishlist
export const getWishlist = async (req: Request, res: Response) => {
  try {
    const result = await getPopulatedWishlist(req.user!.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ message: "Failed to load wishlist." });
  }
};

// POST /api/wishlist/items/:productId
export const addWishlistItem = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;

    if (typeof productId !== "string") {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const productExists = await Product.exists({ _id: productId });

    if (!productExists) {
      return res.status(404).json({ message: "Product not found." });
    }

    await Wishlist.findOneAndUpdate(
      { user: req.user!.id },
      {
        $addToSet: { items: new mongoose.Types.ObjectId(productId) },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    const result = await getPopulatedWishlist(req.user!.id);

    return res.status(200).json({
      message: "Product added to wishlist.",
      ...result,
    });
  } catch (error) {
    console.error("Add wishlist item error:", error);
    return res
      .status(500)
      .json({ message: "Failed to add product to wishlist." });
  }
};

// DELETE /api/wishlist/items/:productId
export const removeWishlistItem = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;

    if (typeof productId !== "string") {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    await Wishlist.findOneAndUpdate(
      { user: req.user!.id },
      {
        $pull: { items: new mongoose.Types.ObjectId(productId) },
      },
    );

    const result = await getPopulatedWishlist(req.user!.id);

    return res.status(200).json({
      message: "Product removed from wishlist.",
      ...result,
    });
  } catch (error) {
    console.error("Remove wishlist item error:", error);
    return res
      .status(500)
      .json({ message: "Failed to remove product from wishlist." });
  }
};
