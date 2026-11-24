// import { Router } from "express";
// import {
//   createProduct,
//   deleteProduct,
//   getProductById,
//   getProducts,
//   getManagedProducts,
//   getProductCategories,
//   updateProduct,
// } from "../controllers/product.controller.js";
// import { authorize, protect } from "../middleware/auth.middleware.js";

// const router = Router();

// // Public product browsing
// router.get("/", getProducts);

// router.get("/categories", getProductCategories);

// // Admin and Sales Person product management
// router.get(
//   "/mine",
//   protect,
//   authorize("admin", "salesperson"),
//   getManagedProducts,
// );

// router.get("/:id", getProductById);

// router.post("/", protect, authorize("admin", "salesperson"), createProduct);

// router.put("/:id", protect, authorize("admin", "salesperson"), updateProduct);

// router.delete(
//   "/:id",
//   protect,
//   authorize("admin", "salesperson"),
//   deleteProduct,
// );

// export default router;

import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getManagedProducts,
  getProductCategories,
  updateProduct,
} from "../controllers/product.controller.js";

import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

// Public product browsing
router.get("/", getProducts);
router.get("/categories", getProductCategories);

// Admin and Sales Person product management
router.get(
  "/mine",
  protect,
  authorize("admin", "salesperson"),
  getManagedProducts,
);

router.post("/", protect, authorize("admin", "salesperson"), createProduct);

// Keep the dynamic product ID route after the named GET routes
router.get("/:id", getProductById);

router.put("/:id", protect, authorize("admin", "salesperson"), updateProduct);

router.delete(
  "/:id",
  protect,
  authorize("admin", "salesperson"),
  deleteProduct,
);

export default router;
