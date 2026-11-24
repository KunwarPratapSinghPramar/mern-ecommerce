import { Request, Response } from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const getSalesOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const sellerProducts = await Product.find({
      owner: req.user?.id,
    }).select("_id");

    const productIds = sellerProducts.map((product) => product._id);

    if (productIds.length === 0) {
      return res.status(200).json({
        orders: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      });
    }

    const filter = {
      "items.product": { $in: productIds },
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const sellerProductIds = new Set(productIds.map(String));

    const sellerOrders = orders.map((order) => ({
      ...order,
      // Only expose this seller's line items.
      items: order.items.filter((item) =>
        sellerProductIds.has(String(item.product)),
      ),
    }));

    return res.status(200).json({
      orders: sellerOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Sales orders error:", error);
    return res.status(500).json({
      message: "Failed to fetch sales orders",
    });
  }
};
