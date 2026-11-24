import mongoose from "mongoose";
import type { Request, Response } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";
import User from "../models/User.js";

const getOrderIdParam = (id: string | string[]): string | null => {
  return typeof id === "string" ? id : null;
};

const validStatuses = [
  "payment_pending",
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof validStatuses)[number];

const allowedTransitions: Record<string, OrderStatus[]> = {
  placed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
};

export const getAllOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const { status, paymentStatus, paymentMethod, search } = req.query;

    const filter: Record<string, unknown> = {};

    if (typeof status === "string") {
      if (!validStatuses.includes(status as OrderStatus)) {
        res.status(400).json({ message: "Invalid order status" });
        return;
      }
      filter.status = status;
    }

    if (typeof paymentStatus === "string") {
      if (!["pending", "paid", "failed", "refunded"].includes(paymentStatus)) {
        res.status(400).json({ message: "Invalid payment status" });
        return;
      }
      filter.paymentStatus = paymentStatus;
    }

    if (typeof paymentMethod === "string") {
      if (!["cod", "razorpay"].includes(paymentMethod)) {
        res.status(400).json({ message: "Invalid payment method" });
        return;
      }
      filter.paymentMethod = paymentMethod;
    }

    if (typeof search === "string" && search.trim()) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ],
      }).select("_id");

      filter.$or = [
        ...(mongoose.Types.ObjectId.isValid(search.trim())
          ? [{ _id: search.trim() }]
          : []),
        { user: { $in: matchingUsers.map((user) => user._id) } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getAdminOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getOrderIdParam(req.params.id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .lean();

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error("Get admin order error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body as { status?: string };

    const id = getOrderIdParam(req.params.id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    if (
      typeof status !== "string" ||
      !validStatuses.includes(status as OrderStatus) ||
      status === "cancelled" ||
      status === "payment_pending"
    ) {
      res.status(400).json({ message: "Invalid target order status" });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const nextStatus = status as OrderStatus;

    if (!allowedTransitions[order.status]?.includes(nextStatus)) {
      res.status(400).json({
        message: `Cannot change order status from ${order.status} to ${nextStatus}`,
      });
      return;
    }

    // An order must be paid before it can be shipped or delivered.
    if (
      ["shipped", "delivered"].includes(nextStatus) &&
      order.paymentMethod === "razorpay" &&
      order.paymentStatus !== "paid"
    ) {
      res.status(409).json({
        message: "A Razorpay order must be paid before shipping",
      });
      return;
    }

    order.status = nextStatus;
    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};

export const cancelAdminOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const adminId = req.user?.id;

  if (!adminId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const id = getOrderIdParam(req.params.id);

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid order ID" });
    return;
  }

  const session = await mongoose.startSession();
  let cancelledOrderId: string | null = null;

  try {
    await session.withTransaction(async () => {
      const order = await Order.findOneAndUpdate(
        {
          _id: id,
          status: { $nin: ["cancelled", "shipped", "delivered"] },
          paymentStatus: { $ne: "paid" },
        },
        { $set: { status: "cancelled" } },
        { new: true, session },
      );

      if (!order) {
        const existing = await Order.findById(id).session(session);

        if (!existing) throw new Error("ORDER_NOT_FOUND");
        if (existing.status === "cancelled") {
          throw new Error("ORDER_ALREADY_CANCELLED");
        }
        if (existing.paymentStatus === "paid") {
          throw new Error("PAID_ORDER_REQUIRES_REFUND");
        }

        throw new Error("ORDER_CANNOT_BE_CANCELLED");
      }

      if (order.paymentMethod === "razorpay") {
        order.paymentStatus = "failed";
        await order.save({ session });
      }

      for (const item of order.items) {
        const product = await Product.findOneAndUpdate(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { new: true, runValidators: true, session },
        );

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.product.toString()}`);
        }

        await InventoryMovement.create(
          [
            {
              product: product._id,
              changedBy: adminId,
              type: "cancellation",
              quantityChange: item.quantity,
              previousStock: product.stock - item.quantity,
              newStock: product.stock,
              reason: "Order cancelled by administrator",
              notes: `Cancelled order: ${order._id}`,
            },
          ],
          { session },
        );
      }

      cancelledOrderId = order._id.toString();
    });

    if (!cancelledOrderId) {
      res.status(500).json({ message: "Order cancellation failed" });
      return;
    }

    const cancelledOrder = await Order.findById(cancelledOrderId).populate(
      "user",
      "name email",
    );

    res.status(200).json({
      message: "Order cancelled and product stock restored",
      order: cancelledOrder,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    const errors: Record<string, { status: number; message: string }> = {
      ORDER_NOT_FOUND: {
        status: 404,
        message: "Order not found",
      },
      ORDER_ALREADY_CANCELLED: {
        status: 409,
        message: "Order is already cancelled",
      },
      PAID_ORDER_REQUIRES_REFUND: {
        status: 409,
        message: "Paid orders require a refund before cancellation",
      },
      ORDER_CANNOT_BE_CANCELLED: {
        status: 409,
        message: "Shipped or delivered orders cannot be cancelled",
      },
    };

    const knownError = errors[message];

    if (knownError) {
      res.status(knownError.status).json({ message: knownError.message });
      return;
    }

    console.error("Cancel admin order error:", error);
    res.status(500).json({ message: "Failed to cancel order" });
  } finally {
    await session.endSession();
  }
};

export const markCodOrderPaid = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = getOrderIdParam(req.params.id);

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order ID" });
      return;
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "delivered",
      },
      {
        $set: { paymentStatus: "paid" },
      },
      { new: true },
    );

    if (!order) {
      const existing = await Order.findById(id);

      if (!existing) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      res.status(409).json({
        message:
          "Only delivered COD orders with pending payment can be marked paid",
      });
      return;
    }

    res.status(200).json({
      message: "COD payment marked as paid",
      order,
    });
  } catch (error) {
    console.error("Mark COD payment error:", error);
    res.status(500).json({ message: "Failed to update COD payment" });
  }
};
