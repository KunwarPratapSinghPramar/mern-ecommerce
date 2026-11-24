import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProducts } from "../services/productApi";
import { addCartItem } from "../services/cartApi";
import { useAuth } from "../context/useAuth";
import type { Product } from "../types/product";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  const isCustomer = user?.role === "user";

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        // const products = await getProducts();
        // const found = products.find((item) => item._id === id);
        const result = await getProducts();
        const found = result.products.find((item) => item._id === id);
        setProduct(found ?? null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !isCustomer) return;

    try {
      setAdding(true);
      setMessage("");

      await addCartItem(product._id, quantity);
      window.dispatchEvent(new Event("cart-updated"));
      setMessage("Product added to your cart.");
    } catch {
      setMessage(
        "Unable to add this product. Please check the available stock.",
      );
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);

  if (loading) {
    return <div className="p-10 text-center">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link
          to="/"
          className="mt-4 inline-block text-blue-700 hover:underline"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="text-sm font-medium text-blue-700 hover:underline"
      >
        ← Back to products
      </Link>

      <div className="mt-6 grid gap-10 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
        <div className="flex min-h-80 items-center justify-center rounded-xl bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="max-h-[480px] w-full object-contain"
            />
          ) : (
            <span className="text-gray-400">No product image available</span>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {product.category}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-gray-500">Brand: {product.brand}</p>

          <p className="mt-6 text-3xl font-extrabold text-gray-900">
            {formatPrice(product.price)}
          </p>

          <p
            className={`mt-3 text-sm font-medium ${
              product.stock > 0 ? "text-green-700" : "text-red-600"
            }`}
          >
            {product.stock > 0
              ? `${product.stock} units available`
              : "Currently out of stock"}
          </p>

          <div className="mt-6 border-t pt-5">
            <h2 className="font-semibold">Product Description</h2>
            <p className="mt-2 whitespace-pre-line leading-7 text-gray-600">
              {product.description}
            </p>
          </div>

          {isCustomer && product.stock > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <label htmlFor="quantity" className="font-medium">
                Quantity
              </label>

              <input
                id="quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setQuantity(Math.min(product.stock, Math.max(1, value || 1)));
                }}
                className="w-20 rounded-lg border px-3 py-2"
              />
            </div>
          )}

          {isCustomer && message && (
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              {message}
            </p>
          )}

          {isCustomer && (
            <button
              type="button"
              onClick={() => void handleAddToCart()}
              disabled={adding || product.stock <= 0}
              className="mt-7 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {adding
                ? "Adding to Cart..."
                : product.stock <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
