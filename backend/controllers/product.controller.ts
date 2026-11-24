import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";

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
      owner: req.user?.id,
    });

    if (product.stock > 0 && req.user?.id) {
      await InventoryMovement.create({
        product: product._id,
        changedBy: req.user.id,
        type: "initial",
        quantityChange: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: "Initial product stock",
      });
    }

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

// export const getProducts = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   try {
//     const {
//       search,
//       category,
//       sort = "newest",
//       page = "1",
//       limit = "12",
//     } = req.query;

//     const currentPage = Math.max(1, Number(page) || 1);
//     const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

//     const filter: Record<string, unknown> = {};

//     if (category && typeof category === "string") {
//       filter.category = category;
//     }

//     if (search && typeof search === "string") {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { brand: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     const sortOptions: Record<string, 1 | -1> =
//       sort === "price-low"
//         ? { price: 1 }
//         : sort === "price-high"
//           ? { price: -1 }
//           : { createdAt: -1 };

//     const [products, total] = await Promise.all([
//       Product.find(filter)
//         .sort(sortOptions)
//         .skip((currentPage - 1) * pageSize)
//         .limit(pageSize),
//       Product.countDocuments(filter),
//     ]);

//     res.status(200).json({
//       products,
//       pagination: {
//         total,
//         page: currentPage,
//         limit: pageSize,
//         totalPages: Math.ceil(total / pageSize),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to fetch products",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// };

export const getProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = "12",
    } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

    const filter: Record<string, unknown> = {};

    if (category && typeof category === "string" && category !== "All") {
      filter.category = category;
    }

    if (search && typeof search === "string" && search.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { brand: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const priceFilter: Record<string, number> = {};

    if (minPrice !== undefined && minPrice !== "") {
      const minimum = Number(minPrice);

      if (!Number.isFinite(minimum) || minimum < 0) {
        res.status(400).json({ message: "Invalid minimum price" });
        return;
      }

      priceFilter.$gte = minimum;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const maximum = Number(maxPrice);

      if (!Number.isFinite(maximum) || maximum < 0) {
        res.status(400).json({ message: "Invalid maximum price" });
        return;
      }

      priceFilter.$lte = maximum;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      res.status(400).json({
        message: "Minimum price cannot be greater than maximum price",
      });
      return;
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
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

export const getProductCategories = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const categories = await Product.distinct("category");

    res.status(200).json({
      categories: categories.sort((a, b) => a.localeCompare(b)),
    });
  } catch {
    res.status(500).json({
      message: "Failed to fetch product categories",
    });
  }
};

export const getManagedProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    const filter = req.user?.role === "admin" ? {} : { owner: req.user?.id };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Managed products error:", error);
    return res.status(500).json({
      message: "Failed to fetch managed products",
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
    const productId = req.params.id;
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

    const productFilter =
      req.user?.role === "admin"
        ? { _id: productId }
        : { _id: productId, owner: req.user?.id };

    const product = await Product.findOneAndUpdate(productFilter, updates, {
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
    const productId = req.params.id;
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(400).json({ message: "Invalid product ID" });
      return;
    }

    const productFilter =
      req.user?.role === "admin"
        ? { _id: productId }
        : { _id: productId, owner: req.user?.id };

    const product = await Product.findOneAndDelete(productFilter);

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
