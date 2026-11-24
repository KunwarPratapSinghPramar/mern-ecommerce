import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { getWishlist, removeWishlistItem } from "../services/wishlistApi";
import type { Product } from "../types/product";

export default function Wishlist() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    try {
      setError("");
      const result = await getWishlist();
      setProducts(result.items);
    } catch {
      setError("Unable to load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWishlist();

    const handleWishlistUpdate = () => {
      void loadWishlist();
    };

    window.addEventListener("wishlist-updated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
    };
  }, [loadWishlist]);

  const handleRemove = async (productId: string) => {
    try {
      setRemovingId(productId);
      setError("");

      const result = await removeWishlistItem(productId);
      setProducts(result.items);
    } catch {
      setError("Unable to remove this product. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 text-center">
        Loading your wishlist...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="text-pink-600" size={30} />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your saved products ({products.length})
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <Heart className="mx-auto mb-4 text-gray-300" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-gray-500">
            Save products you like and find them here later.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product._id}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              <Link to={`/products/${product._id}`}>
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-gray-100 text-gray-400">
                    No image available
                  </div>
                )}
              </Link>

              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {product.category}
                </p>

                <Link
                  to={`/products/${product._id}`}
                  className="mt-1 block text-lg font-semibold text-gray-900 hover:text-blue-700"
                >
                  {product.name}
                </Link>

                <p className="mt-2 text-xl font-bold text-blue-700">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    to={`/products/${product._id}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Product
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleRemove(product._id)}
                    disabled={removingId === product._id}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {removingId === product._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
