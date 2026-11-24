import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";
import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import { startPaymentExpiryScheduler } from "./utils/paymentExpiryScheduler.js";
import salesRoutes from "./routes/sales.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import adminStatsRoutes from "./routes/adminStats.routes.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as Postman.
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      (
        req as import("express").Request & {
          rawBody?: Buffer;
        }
      ).rawBody = Buffer.from(buffer);
    },
  }),
);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "MERN E-Commerce Server is up!",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

//Product routes
app.use("/api/products", productRoutes);

//Upload routes
app.use("/api/uploads", uploadRoutes);

//Inventry routes
app.use("/api/inventory", inventoryRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/admin/orders", adminOrderRoutes);

app.use("/api/sales", salesRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/admin/stats", adminStatsRoutes);

const startServer = async () => {
  try {
    if (!env.mongoUri || !env.jwtSecret) {
      throw new Error("Missing required environment variables.");
    }

    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected successfully");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
      startPaymentExpiryScheduler();
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
