import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";

const PAYMENT_EXPIRY_MINUTES = 15;

export const expirePendingPayments = async (): Promise<void> => {
  const expiryTime = new Date(Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000);

  // Find orders old enough to expire.
  const expiredOrders = await Order.find({
    status: "payment_pending",
    paymentStatus: "pending",
    createdAt: { $lte: expiryTime },
  }).select("_id");

  for (const candidate of expiredOrders) {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Recheck eligibility inside the transaction.
        // This prevents duplicate stock restoration.
        const order = await Order.findOneAndUpdate(
          {
            _id: candidate._id,
            status: "payment_pending",
            paymentStatus: "pending",
            createdAt: { $lte: expiryTime },
          },
          {
            $set: {
              status: "cancelled",
              paymentStatus: "failed",
            },
          },
          {
            new: true,
            session,
          },
        );

        // Another process may already have handled this order.
        if (!order) {
          return;
        }

        for (const item of order.items) {
          const product = await Product.findOneAndUpdate(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            {
              new: true,
              runValidators: true,
              session,
            },
          );

          if (!product) {
            throw new Error(
              `Product ${item.product.toString()} not found while restoring stock for order ${order._id}`,
            );
          }

          await InventoryMovement.create(
            [
              {
                product: product._id,
                // The order's customer is retained as the associated user.
                changedBy: order.user,
                type: "cancellation",
                quantityChange: item.quantity,
                previousStock: product.stock - item.quantity,
                newStock: product.stock,
                reason:
                  "Automatic restoration of stock after unpaid order expiry",
                notes: `Expired Razorpay order: ${order._id}`,
              },
            ],
            { session },
          );
        }

        console.log(
          `Expired unpaid order ${order._id}; reserved stock restored.`,
        );
      });
    } catch (error) {
      console.error(`Failed to expire order ${candidate._id}:`, error);
    } finally {
      await session.endSession();
    }
  }
};
