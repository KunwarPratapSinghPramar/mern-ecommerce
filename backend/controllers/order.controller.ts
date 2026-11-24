import { Request, Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order, { IShippingAddress } from "../models/Order.js";
import InventoryMovement from "../models/InventoryMovement.js";

const SHIPPING_FEE = 0;

const isValidShippingAddress = (
  address: Partial<IShippingAddress>,
): boolean => {
  return Boolean(
    address &&
    address.fullName?.trim() &&
    address.phone?.trim() &&
    address.addressLine1?.trim() &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.postalCode?.trim() &&
    address.country?.trim(),
  );
};

export const checkout = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const shippingAddress = req.body.shippingAddress as
    IShippingAddress | undefined;

  if (!isValidShippingAddress(shippingAddress ?? {})) {
    return res.status(400).json({
      message: "Please provide all required shipping address fields",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdOrder: InstanceType<typeof Order> | null = null;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("CART_EMPTY");
      }

      const orderItems: Array<{
        product: mongoose.Types.ObjectId;
        name: string;
        price: number;
        quantity: number;
        image?: string;
      }> = [];

      let subtotal = 0;

      // Process sequentially inside the transaction.
      for (const cartItem of cart.items) {
        const product = await Product.findById(cartItem.product).session(
          session,
        );

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const quantity = cartItem.quantity;

        if (!Number.isInteger(quantity) || quantity < 1) {
          throw new Error("INVALID_CART_QUANTITY");
        }

        // Conditional update prevents two customers from buying
        // the same remaining stock simultaneously.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            runValidators: true,
            session,
          },
        );

        if (!updatedProduct) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const lineTotal = product.price * quantity;
        subtotal += lineTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.[0],
        });
      }

      const shippingFee = SHIPPING_FEE;
      const total = subtotal + shippingFee;

      const [order] = await Order.create(
        [
          {
            user: new mongoose.Types.ObjectId(userId),
            items: orderItems,
            shippingAddress,
            subtotal,
            shippingFee,
            total,
            paymentMethod: "cod",
            paymentStatus: "pending",
            status: "placed",
          },
        ],
        { session },
      );

      // Record one inventory movement for every product sold.
      for (const item of orderItems) {
        const updatedProduct = await Product.findById(item.product).session(
          session,
        );

        if (!updatedProduct) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        await InventoryMovement.create(
          [
            {
              product: item.product,
              changedBy: new mongoose.Types.ObjectId(userId),
              type: "sale",
              quantityChange: -item.quantity,
              previousStock: updatedProduct.stock + item.quantity,
              newStock: updatedProduct.stock,
              reason: "Customer order checkout",
              notes: `Order ID: ${order._id}`,
            },
          ],
          { session },
        );
      }

      // Cart is cleared only if the entire transaction commits.
      await Cart.updateOne(
        { user: userId },
        { $set: { items: [] } },
        { session },
      );

      createdOrder = order;
    });

    if (!createdOrder) {
      return res.status(500).json({
        message: "Order could not be created",
      });
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (errorMessage === "CART_EMPTY") {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    if (errorMessage === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "A product in your cart no longer exists",
      });
    }

    if (errorMessage === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "One or more products do not have enough stock",
      });
    }

    if (errorMessage === "INVALID_CART_QUANTITY") {
      return res.status(400).json({
        message: "Your cart contains an invalid quantity",
      });
    }

    console.error("Checkout transaction error:", error);

    return res.status(500).json({
      message: "Checkout failed. No order or stock changes were committed.",
    });
  } finally {
    await session.endSession();
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get customer orders error:", error);
    return res.status(500).json({ message: "Failed to get orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orderId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ message: "Failed to get order" });
  }
};
