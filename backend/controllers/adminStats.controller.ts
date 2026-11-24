
import type { Request, Response } from "express";
import Order from "../models/Order.js";

export const getAdminStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [totalOrders, paidSales, orderStatusCounts] = await Promise.all([
      Order.countDocuments(),

      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
          },
        },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalSales = paidSales[0]?.totalSales ?? 0;

    const ordersByStatus = orderStatusCounts.reduce(
      (result, item) => {
        result[item._id] = item.count;
        return result;
      },
      {} as Record<string, number>,
    );

    res.status(200).json({
      totalSales,
      totalOrders,
      ordersByStatus,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
