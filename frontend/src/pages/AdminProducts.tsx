import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

import StockBadge from "../components/admin/StockBadge";

import type {
  InventoryMovement,
  Product,
  ProductInput,
} from "../types/product";

import {
  adjustStock,
  createProduct,
  deleteProduct,
  getInventoryHistory,
  getManagedProducts,
  updateProduct,
  uploadProductImages,
} from "../services/productApi";

const emptyForm: ProductInput = {
  name: "",
  description: "",
  price: 0,
  category: "",
  brand: "",
  stock: 0,
  images: [],
  isFeatured: false,
};

const PAGE_SIZE = 10;
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function AdminProducts() {
  // Product list and pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search and filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Product form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>({ ...emptyForm });
  const [priceInput, setPriceInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFormRef = useRef<HTMLElement>(null);
  const draftRestored = useRef(false);
  const PRODUCT_DRAFT_KEY = "mern-store-admin-product-draft";

  // Loading and error states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  // Inventory adjustment
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(
    null,
  );
  const [quantityChange, setQuantityChange] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  // Inventory history
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(PRODUCT_DRAFT_KEY);

      if (savedDraft) {
        const draft = JSON.parse(savedDraft);

        if (draft.form) {
          setForm(draft.form);
        }

        if (draft.editingProduct) {
          setEditingProduct(draft.editingProduct);
        }

        if (typeof draft.priceInput === "string") {
          setPriceInput(draft.priceInput);
        }

        if (typeof draft.stockInput === "string") {
          setStockInput(draft.stockInput);
        }
      }
    } catch {
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
    }

    draftRestored.current = true;
  }, []);

  useEffect(() => {
    if (!draftRestored.current) return;

    const hasDraft =
      Boolean(editingProduct) ||
      form.name.trim() !== "" ||
      form.description.trim() !== "" ||
      form.category.trim() !== "" ||
      form.brand.trim() !== "" ||
      priceInput !== "" ||
      stockInput !== "" ||
      form.images.length > 0 ||
      form.isFeatured;

    if (!hasDraft) {
      localStorage.removeItem(PRODUCT_DRAFT_KEY);
      return;
    }

    const draft = {
      form,
      editingProduct,
      priceInput,
      stockInput,
    };

    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(draft));
  }, [form, editingProduct, priceInput, stockInput]);

  const showError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  const loadProducts = async () => {
    try {
      setError("");
      const result = await getManagedProducts();
      setProducts(result);
    } catch (err: any) {
      showError(err.response?.data?.message ?? "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    // Load products when the page first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inventory summary
  const lowStockCount = products.filter(
    (product) => product.stock > 0 && product.stock <= 5,
  ).length;

  const outOfStockCount = products.filter(
    (product) => product.stock === 0,
  ).length;

  // Search and stock filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const term = search.trim().toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.brand ?? "").toLowerCase().includes(term);

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && product.stock > 0 && product.stock <= 5) ||
        (stockFilter === "out" && product.stock === 0) ||
        (stockFilter === "available" && product.stock > 5);

      return matchesSearch && matchesStock;
    });
  }, [products, search, stockFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [search, stockFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // Reset product form
  const startCreate = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm });
    setPriceInput("");
    setStockInput("");
    setSelectedFiles([]);
    setError("");

    localStorage.removeItem(PRODUCT_DRAFT_KEY);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Load a product into the form for editing
  const startEdit = (product: Product) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      images: product.images ?? [],
      isFeatured: product.isFeatured,
    });

    setPriceInput(String(product.price));
    setStockInput(String(product.stock));
    setSelectedFiles([]);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setTimeout(() => {
      productFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Create or update product
  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const price = Number(priceInput);
    const stock = Number(stockInput);

    if (!form.name.trim() || !form.category.trim()) {
      showError("Product name and category are required.");
      return;
    }

    if (priceInput.trim() === "" || !Number.isFinite(price) || price < 0) {
      showError("Enter a valid product price.");
      return;
    }

    if (
      !editingProduct &&
      (stockInput.trim() === "" || !Number.isInteger(stock) || stock < 0)
    ) {
      showError("Stock must be a whole number and cannot be negative.");
      return;
    }

    if (form.images.length + selectedFiles.length > MAX_IMAGES) {
      showError(`A product can have a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    try {
      setSaving(true);
      setError("");

      let imageUrls = [...form.images];

      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadProductImages(selectedFiles);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const productData: ProductInput = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        brand: form.brand.trim(),
        price,
        stock: editingProduct ? editingProduct.stock : stock,
        images: imageUrls,
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        toast.success("Product updated successfully.");
      } else {
        await createProduct(productData);
        toast.success("Product created successfully.");
      }

      setEditingProduct(null);
      setForm({ ...emptyForm });
      setPriceInput("");
      setStockInput("");
      setSelectedFiles([]);

      localStorage.removeItem(PRODUCT_DRAFT_KEY);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadProducts();
    } catch (err: any) {
      showError(
        err.response?.data?.message ?? err.message ?? "Could not save product.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (product: Product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product._id);
      toast.success("Product deleted successfully.");
      await loadProducts();
    } catch (err: any) {
      showError(err.response?.data?.message ?? "Could not delete product.");
    }
  };

  // Adjust product stock
  const handleStockAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adjustingProduct) return;

    const change = Number(quantityChange);

    if (
      quantityChange.trim() === "" ||
      !Number.isInteger(change) ||
      change === 0
    ) {
      showError("Enter a non-zero whole number, such as 10 or -2.");
      return;
    }

    if (!adjustmentReason.trim()) {
      showError("Enter a reason for this stock adjustment.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await adjustStock(
        adjustingProduct._id,
        change,
        adjustmentReason.trim(),
        adjustmentNotes.trim(),
      );

      setAdjustingProduct(null);
      setQuantityChange("");
      setAdjustmentReason("");
      setAdjustmentNotes("");

      toast.success("Stock updated successfully.");
      await loadProducts();
    } catch (err: any) {
      showError(err.response?.data?.message ?? "Stock adjustment failed.");
    } finally {
      setSaving(false);
    }
  };

  // Open inventory history
  const openHistory = async (product: Product) => {
    setHistoryProduct(product);
    setHistory([]);
    setHistoryLoading(true);
    setError("");

    try {
      const result = await getInventoryHistory(product._id);
      setHistory(result.movements);
    } catch (err: any) {
      showError(err.response?.data?.message ?? "Could not load stock history.");
      setHistoryProduct(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Validate newly selected images
  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (form.images.length + selectedFiles.length + files.length > MAX_IMAGES) {
      showError(`A product can have a maximum of ${MAX_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type),
    );

    if (invalidFile) {
      showError("Only PNG, JPEG and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFile) {
      showError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const removeSelectedImage = (indexToRemove: number) => {
    setSelectedFiles((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );
  };

  const removeExistingImage = (indexToRemove: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
        {error && (
          <div
            ref={errorRef}
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
            <button
              type="button"
              className="ml-3 font-bold underline"
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Inventory summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total products</p>
            <p className="mt-2 text-3xl font-bold">{products.length}</p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Low-stock products</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {lowStockCount}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Out of stock</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {outOfStockCount}
            </p>
          </div>
        </div>

        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-900">
              Inventory attention required
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              {lowStockCount} product(s) have low stock and {outOfStockCount}{" "}
              product(s) are out of stock.
            </p>
          </div>
        )}

        {/* Products table */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Products</h2>
            <p className="text-sm text-slate-500">
              Add products, update details and manage stock.
            </p>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, category or brand..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="all">All stock</option>
              <option value="available">In stock</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading products...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              No products found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b bg-slate-50 text-slate-600">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedProducts.map((product, index) => (
                      <tr key={product._id} className="border-b last:border-0">
                        <td className="p-3 text-slate-500">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                No image
                              </div>
                            )}

                            <div>
                              <p className="font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">{product.category}</td>

                        <td className="p-3">
                          {Number(product.price).toFixed(2)}
                        </td>

                        <td className="p-3 font-semibold">{product.stock}</td>

                        <td className="p-3">
                          <StockBadge stock={product.stock} />
                        </td>

                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(product)}
                              className="font-semibold text-blue-600 hover:underline"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => setAdjustingProduct(product)}
                              className="font-semibold text-emerald-700 hover:underline"
                            >
                              Adjust stock
                            </button>

                            <button
                              type="button"
                              onClick={() => void openHistory(product)}
                              className="font-semibold text-slate-600 hover:underline"
                            >
                              History
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(product)}
                              className="font-semibold text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                  {Math.min(page * PAGE_SIZE, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="px-2 text-sm">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className="rounded-lg border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section
          ref={productFormRef}
          className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm"
        ></section>

        {/* Add or edit product form */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">
            {editingProduct ? "Edit product" : "Add a product"}
          </h2>

          <form
            onSubmit={handleSaveProduct}
            className="grid gap-4 md:grid-cols-2"
          >
            <label className="space-y-1 text-sm font-medium">
              Product name *
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="space-y-1 text-sm font-medium">
              Brand
              <input
                value={form.brand}
                onChange={(event) =>
                  setForm({ ...form, brand: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="space-y-1 text-sm font-medium">
              Category *
              <input
                required
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="space-y-1 text-sm font-medium">
              Price
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={priceInput}
                onChange={(event) => {
                  setPriceInput(event.target.value);
                  setForm({
                    ...form,
                    price:
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="space-y-1 text-sm font-medium">
              Initial stock
              <input
                required={!editingProduct}
                type="number"
                min="0"
                step="1"
                disabled={Boolean(editingProduct)}
                value={stockInput}
                onChange={(event) => {
                  setStockInput(event.target.value);
                  setForm({
                    ...form,
                    stock:
                      event.target.value === ""
                        ? 0
                        : Number(event.target.value),
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2.5 disabled:bg-slate-100"
              />
              {editingProduct && (
                <span className="block text-xs font-normal text-slate-500">
                  Use Adjust stock to change inventory and record its history.
                </span>
              )}
            </label>

            {/* Product images */}
            <div className="space-y-2 text-sm font-medium">
              Product images
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleImageSelection}
                className="block w-full rounded-lg border border-slate-300 p-2"
              />
              <span className="block text-xs font-normal text-slate-500">
                PNG, JPEG or WebP. Maximum 5 images, 5 MB each.
              </span>
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.images.map((image, index) => (
                    <div key={`${image}-${index}`} className="relative">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="h-20 w-20 rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white"
                        aria-label="Remove existing image"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">
                    New images selected:
                  </p>

                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                    >
                      <span className="truncate text-xs font-normal">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="space-y-1 text-sm font-medium md:col-span-2">
              Description
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm({
                    ...form,
                    isFeatured: event.target.checked,
                  })
                }
              />
              Featured product
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Save changes"
                    : "Create product"}
              </button>

              <button
                type="button"
                onClick={startCreate}
                className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>
      </section>

      {/* Stock adjustment modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleStockAdjustment}
            className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-bold">Adjust inventory</h2>

            <p className="text-sm text-slate-600">
              {adjustingProduct.name} — Current stock:{" "}
              <strong>{adjustingProduct.stock}</strong>
            </p>

            <label className="block space-y-1 text-sm font-medium">
              Quantity change
              <input
                required
                type="number"
                step="1"
                value={quantityChange}
                onChange={(event) => setQuantityChange(event.target.value)}
                placeholder="Example: 10 or -2"
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
              <span className="block text-xs font-normal text-slate-500">
                Positive adds stock. Negative removes stock.
              </span>
            </label>

            <label className="block space-y-1 text-sm font-medium">
              Reason
              <input
                required
                maxLength={200}
                value={adjustmentReason}
                onChange={(event) => setAdjustmentReason(event.target.value)}
                placeholder="New shipment, damaged items..."
                className="w-full rounded-lg border border-slate-300 p-2.5"
              />
            </label>

            <label className="block space-y-1 text-sm font-medium">
              Notes (optional)
              <textarea
                maxLength={500}
                value={adjustmentNotes}
                onChange={(event) => setAdjustmentNotes(event.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5"
                rows={3}
              />
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Updating..." : "Confirm adjustment"}
              </button>

              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                className="rounded-lg border px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory history modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Inventory history</h2>
                <p className="text-sm text-slate-500">{historyProduct.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            {historyLoading ? (
              <p className="py-8 text-center">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                No inventory movements recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Change</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Changed by</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((movement) => (
                      <tr key={movement._id} className="border-b">
                        <td className="p-3">
                          {new Date(movement.createdAt).toLocaleString()}
                        </td>

                        <td
                          className={`p-3 font-bold ${
                            movement.quantityChange > 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {movement.quantityChange > 0 ? "+" : ""}
                          {movement.quantityChange}
                        </td>

                        <td className="p-3">
                          {movement.previousStock} → {movement.newStock}
                        </td>

                        <td className="p-3">
                          <p>{movement.reason}</p>
                          {movement.notes && (
                            <p className="text-xs text-slate-500">
                              {movement.notes}
                            </p>
                          )}
                        </td>

                        <td className="p-3">
                          {movement.changedBy?.name ?? "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
