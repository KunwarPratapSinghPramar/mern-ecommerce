import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";

import { razorpay, keyId } from "../config/razorpay.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order, { IShippingAddress } from "../models/Order.js";
import InventoryMovement from "../models/InventoryMovement.js";
import PaymentWebhookEvent from "../models/PaymentWebhookEvent.js";
import { createHmac, timingSafeEqual } from "node:crypto";

const SHIPPING_FEE = 0;

const isValidAddress = (address: Partial<IShippingAddress>) =>
  Boolean(
    address &&
    address.fullName?.trim() &&
    address.phone?.trim() &&
    address.addressLine1?.trim() &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.postalCode?.trim() &&
    address.country?.trim(),
  );

const safeCompare = (first: string, second: string): boolean => {
  const firstBuffer = Buffer.from(first, "hex");
  const secondBuffer = Buffer.from(second, "hex");

  return (
    firstBuffer.length === secondBuffer.length &&
    firstBuffer.length > 0 &&
    crypto.timingSafeEqual(firstBuffer, secondBuffer)
  );
};

// POST /api/payments/razorpay/create
export const createRazorpayOrder = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const shippingAddress = req.body.shippingAddress as
    IShippingAddress | undefined;

  if (!isValidAddress(shippingAddress ?? {})) {
    return res.status(400).json({
      message: "Please provide all required shipping address fields",
    });
  }

  const idempotencyKey = req.headers["idempotency-key"];

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length < 8 ||
    idempotencyKey.length > 100
  ) {
    return res.status(400).json({
      message: "A valid Idempotency-Key header is required (8–100 characters)",
    });
  }

  try {
    // Return an existing order when the same request is retried.
    const existingOrder = await Order.findOne({
      user: userId,
      idempotencyKey,
    });

    if (existingOrder) {
      return res.status(200).json({
        message: "Payment order already created for this request",
        orderId: existingOrder._id,
        razorpayOrderId: existingOrder.razorpayOrderId,
        amount: Math.round(existingOrder.total * 100),
        currency: "INR",
        keyId,
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // Calculate total using database prices.
    let subtotal = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "A product in your cart no longer exists",
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          message: "Invalid quantity in cart",
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      subtotal += product.price * item.quantity;
    }

    const total = subtotal + SHIPPING_FEE;
    const amountInPaise = Math.round(total * 100);

    if (amountInPaise < 100) {
      return res.status(400).json({
        message: "Payment amount must be at least ₹1",
      });
    }

    // Create Razorpay order.
    const gatewayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${Date.now()}`.slice(0, 40),
      notes: {
        userId,
        idempotencyKey,
      },
    });

    const session = await mongoose.startSession();

    try {
      // Store only the string ID outside the transaction callback.
      let createdOrderId: string | null = null;

      await session.withTransaction(async () => {
        const transactionCart = await Cart.findOne({
          user: userId,
        }).session(session);

        if (!transactionCart || transactionCart.items.length === 0) {
          throw new Error("CART_EMPTY");
        }

        const orderItems: Array<{
          product: mongoose.Types.ObjectId;
          name: string;
          price: number;
          quantity: number;
          image?: string;
        }> = [];

        let transactionSubtotal = 0;

        for (const item of transactionCart.items) {
          const product = await Product.findById(item.product).session(session);

          if (!product) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: product._id,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
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

          transactionSubtotal += product.price * item.quantity;

          orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: product.images?.[0],
          });

          await InventoryMovement.create(
            [
              {
                product: product._id,
                changedBy: new mongoose.Types.ObjectId(userId),
                type: "sale",
                quantityChange: -item.quantity,
                previousStock: updatedProduct.stock + item.quantity,
                newStock: updatedProduct.stock,
                reason: "Razorpay checkout stock reservation",
                notes: `Razorpay order: ${gatewayOrder.id}`,
              },
            ],
            { session },
          );
        }

        const transactionTotal = transactionSubtotal + SHIPPING_FEE;

        if (Math.round(transactionTotal * 100) !== amountInPaise) {
          throw new Error("CART_CHANGED");
        }

        const [order] = await Order.create(
          [
            {
              user: new mongoose.Types.ObjectId(userId),
              items: orderItems,
              shippingAddress,
              subtotal: transactionSubtotal,
              shippingFee: SHIPPING_FEE,
              total: transactionTotal,
              paymentMethod: "razorpay",
              paymentStatus: "pending",
              status: "payment_pending",
              razorpayOrderId: gatewayOrder.id,
              idempotencyKey,
            },
          ],
          { session },
        );

        await Cart.updateOne(
          { user: userId },
          { $set: { items: [] } },
          { session },
        );

        // Important: save the ID as a string, not the document.
        createdOrderId = order._id.toString();
      });

      if (!createdOrderId) {
        return res.status(500).json({
          message: "Unable to create payment order",
        });
      }

      return res.status(201).json({
        message: "Razorpay order created successfully",
        orderId: createdOrderId,
        razorpayOrderId: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        keyId,
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "CART_EMPTY") {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    if (message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({
        message: "A product in your cart no longer exists",
      });
    }

    if (message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient stock for one or more products",
      });
    }

    if (message === "CART_CHANGED") {
      return res.status(409).json({
        message: "Your cart changed during checkout. Please try again.",
      });
    }

    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        message: "This checkout request has already been processed",
      });
    }

    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      message: "Could not create Razorpay payment order",
    });
  }
};

const verifySignature = (expected: string, received: string): boolean => {
  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(received, "hex");

    if (
      expectedBuffer.length === 0 ||
      expectedBuffer.length !== receivedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
};

// POST /api/payments/razorpay/verify
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res.status(400).json({
      message: "Missing Razorpay payment verification details",
    });
  }

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured");
    }

    // Find the customer's order first.
    const order = await Order.findOne({
      user: userId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Make repeated verification requests safe.
    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Payment has already been verified",
        orderId: order._id,
        paymentStatus: order.paymentStatus,
      });
    }

    // Never reactivate an expired/cancelled order.
    if (order.status === "cancelled") {
      return res.status(409).json({
        message:
          "This order has expired. Contact support if your payment was captured.",
      });
    }

    // Verify Razorpay signature.
    const expectedSignature = createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!verifySignature(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // Confirm payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== Math.round(order.total * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        message: "Payment details do not match the order",
      });
    }

    if (payment.status !== "captured") {
      return res.status(409).json({
        message: "Payment has not been captured yet",
        paymentStatus: payment.status,
      });
    }

    // Atomic update: do not allow a cancelled order to become paid.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: userId,
        paymentStatus: { $ne: "paid" },
        status: { $ne: "cancelled" },
      },
      {
        $set: {
          paymentStatus: "paid",
          status: "placed",
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(409).json({
        message:
          "Order status changed during verification. Contact support if payment was captured.",
      });
    }

    return res.status(200).json({
      message: "Payment verified successfully",
      orderId: updatedOrder._id,
      paymentStatus: updatedOrder.paymentStatus,
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);

    return res.status(500).json({
      message: "Payment verification failed",
    });
  }
};

// POST /api/payments/razorpay/webhook
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers["x-razorpay-signature"];

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({
        message: "Webhook configuration error",
      });
    }

    if (typeof receivedSignature !== "string") {
      return res.status(400).json({
        message: "Missing webhook signature",
      });
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody) {
      return res.status(400).json({
        message: "Webhook raw body is missing",
      });
    }

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!verifySignature(expectedSignature, receivedSignature)) {
      return res.status(400).json({
        message: "Invalid webhook signature",
      });
    }

    const eventId = req.headers["x-razorpay-event-id"];

    if (typeof eventId !== "string" || !eventId) {
      return res.status(400).json({
        message: "Missing Razorpay event ID",
      });
    }

    const event = req.body as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
          };
        };
        order?: {
          entity?: {
            id?: string;
          };
        };
      };
    };

    const eventType = event.event;

    if (!eventType) {
      return res.status(400).json({
        message: "Invalid webhook event",
      });
    }

    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id ?? orderEntity?.id;

    const razorpayPaymentId = paymentEntity?.id;

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const existingEvent = await PaymentWebhookEvent.findOne({
          eventId,
        }).session(session);

        // Razorpay may retry webhook delivery. Process each event once.
        if (existingEvent) {
          return;
        }

        await PaymentWebhookEvent.create(
          [
            {
              eventId,
              eventType,
              processedAt: new Date(),
            },
          ],
          { session },
        );

        if (
          !razorpayOrderId ||
          !["payment.captured", "order.paid", "payment.failed"].includes(
            eventType,
          )
        ) {
          return;
        }

        const order = await Order.findOne({
          razorpayOrderId,
        }).session(session);

        if (!order) {
          console.warn(
            "Webhook received for an unknown Razorpay order:",
            razorpayOrderId,
          );
          return;
        }

        if (eventType === "payment.captured" || eventType === "order.paid") {
          const updateFields: Record<string, unknown> = {
            paymentStatus: "paid",
            status: "placed",
          };

          if (razorpayPaymentId) {
            updateFields.razorpayPaymentId = razorpayPaymentId;
          }

          await Order.updateOne(
            { _id: order._id },
            { $set: updateFields },
            { session },
          );
        }

        if (order.status === "cancelled") {
          console.error(
            "LATE PAYMENT: A payment was captured for an expired order.",
            {
              orderId: order._id.toString(),
              razorpayOrderId,
              razorpayPaymentId,
            },
          );

          // Do not reactivate an expired order whose stock has been restored.
          // This payment needs refund reconciliation.
          return;
        }

        if (eventType === "payment.failed") {
          // Stock release is handled separately by an expiry/recovery flow.
          await Order.updateOne(
            {
              _id: order._id,
              paymentStatus: { $ne: "paid" },
            },
            {
              $set: {
                paymentStatus: "failed",
              },
            },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    // A duplicate event can race with another webhook delivery.
    if ((error as { code?: number }).code === 11000) {
      return res.status(200).json({
        received: true,
        duplicate: true,
      });
    }

    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  }
};

// POST /api/payments/razorpay/webhook
export const razorpayWebhook = async (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  const signature = req.headers["x-razorpay-signature"];
  const eventId = req.headers["x-razorpay-event-id"];

  if (
    !rawBody ||
    typeof signature !== "string" ||
    typeof eventId !== "string"
  ) {
    return res.status(400).json({
      message: "Missing webhook body or signature headers",
    });
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is missing");
    return res.status(500).json({ message: "Webhook not configured" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!safeCompare(expectedSignature, signature)) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event: any;

  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Invalid webhook JSON" });
  }

  const eventType = event.event as string;

  if (
    !["payment.captured", "order.paid", "payment.failed"].includes(eventType)
  ) {
    return res.status(200).json({
      message: "Event acknowledged; no action required",
    });
  }

  // const paymentEntity =
  //   event.payload?.payment?.entity ??
  //   event.payload?.order?.entity;

  // const razorpayOrderId = paymentEntity?.order_id ?? paymentEntity?.id;
  // const razorpayPaymentId = paymentEntity?.id;

  const paymentEntity = event.payload?.payment?.entity;
  const orderEntity = event.payload?.order?.entity;

  const razorpayOrderId = paymentEntity?.order_id ?? orderEntity?.id;

  const razorpayPaymentId = paymentEntity?.id;

  if (!razorpayOrderId) {
    return res.status(400).json({
      message: "Webhook does not contain a Razorpay order ID",
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await PaymentWebhookEvent.create(
        [
          {
            eventId,
            eventType,
          },
        ],
        { session },
      );

      const order = await Order.findOne({
        razorpayOrderId,
      }).session(session);

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (eventType === "payment.captured" || eventType === "order.paid") {
        if (order.status !== "cancelled") {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: {
                paymentStatus: "paid",
                status: "placed",
                razorpayPaymentId: razorpayPaymentId,
              },
            },
            { session },
          );
        }
      }

      if (eventType === "payment.failed" && order.paymentStatus !== "paid") {
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              paymentStatus: "failed",
            },
          },
          { session },
        );
      }
    });

    return res.status(200).json({
      message: "Webhook processed successfully",
    });
  } catch (error) {
    // Razorpay retries events. A duplicate event is already safely processed.
    if ((error as { code?: number }).code === 11000) {
      return res.status(200).json({
        message: "Duplicate webhook event already processed",
      });
    }

    console.error("Razorpay webhook processing error:", error);

    return res.status(500).json({
      message: "Webhook processing failed",
    });
  } finally {
    await session.endSession();
  }
};
