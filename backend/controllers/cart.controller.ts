import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

const getUserId = (req: Request): string | undefined => req.user?.id;

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name price images stock category brand",
    });

    if (!cart) {
      return res.status(200).json({
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const populatedItems = cart.items as unknown as Array<{
      product: {
        _id: mongoose.Types.ObjectId;
        name: string;
        price: number;
        images: string[];
        stock: number;
        category: string;
        brand: string;
      } | null;
      quantity: number;
    }>;

    const items = populatedItems
      .filter((item) => item.product !== null)
      .map((item) => ({
        product: item.product!,
        quantity: item.quantity,
        lineTotal: item.product!.price * item.quantity,
      }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return res.status(200).json({
      items,
      subtotal,
      itemCount,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ message: "Failed to get cart" });
  }
};

export const addCartItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { productId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} units are currently available`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: new mongoose.Types.ObjectId(productId),
        quantity,
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price images stock category brand",
    });

    return res.status(200).json({
      message: "Product added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Add cart item error:", error);
    return res.status(500).json({ message: "Failed to add product to cart" });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;
    const { quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} units are currently available`,
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (entry) => entry.product.toString() === productId,
    );

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "items.product",
      select: "name price images stock category brand",
    });

    return res.status(200).json({
      message: "Cart quantity updated",
      cart: updatedCart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return res.status(500).json({ message: "Failed to update cart item" });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return res.status(500).json({ message: "Failed to remove cart item" });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

    return res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return res.status(500).json({ message: "Failed to clear cart" });
  }
};
