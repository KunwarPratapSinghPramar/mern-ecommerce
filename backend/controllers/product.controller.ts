import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      isFeatured,
    } = req.body;

    if (!name || !description || price === undefined || !category || !brand) {
      res.status(400).json({
        message: "Please provide all required product fields",
      });
      return;
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      isFeatured,
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      search,
      category,
      sort = "newest",
      page = "1",
      limit = "12",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter: Record<string, unknown> = {};

    if (category && typeof category === "string") {
      filter.category = category;
    }

    if (search && typeof search === "string") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOptions: Record<string, 1 | -1> =
      sort === "price-low"
        ? { price: 1 }
        : sort === "price-high"
          ? { price: -1 }
          : { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sortOptions)
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      products,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({ product });
  } catch {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "brand",
      "stock",
      "images",
      "isFeatured",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch {
    res.status(500).json({ message: "Failed to delete product" });
  }
};
