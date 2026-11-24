import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { getCart, updateCartItem, removeCartItem } from "../services/cartApi";
import type { CartResponse } from "../types/cart";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);

export default function Cart() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setCart(await getCart());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const changeQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setBusyProduct(productId);
    setError("");

    try {
      await updateCartItem(productId, quantity);
      setCart(await getCart());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to update quantity.");
    } finally {
      setBusyProduct(null);
    }
  };

  const removeItem = async (productId: string) => {
    setBusyProduct(productId);
    setError("");

    try {
      await removeCartItem(productId);
      setCart(await getCart());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to remove item.");
    } finally {
      setBusyProduct(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-xl border bg-white p-12 text-center">
          <ShoppingBag className="mx-auto mb-4 text-gray-400" size={44} />
          <h1 className="text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-gray-500">
            Add some products before checking out.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold">Shopping Cart</h1>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {cart.items.map((item) => {
              const product = item.product;
              const busy = busyProduct === product._id;

              return (
                <div
                  key={product._id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border bg-white p-4"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-gray-100" />
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold">{product.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(product.price)}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        disabled={busy || item.quantity <= 1}
                        onClick={() =>
                          void changeQuantity(product._id, item.quantity - 1)
                        }
                        className="rounded border p-1 disabled:opacity-40"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="min-w-5 text-center">
                        {item.quantity}
                      </span>

                      <button
                        disabled={busy || item.quantity >= product.stock}
                        onClick={() =>
                          void changeQuantity(product._id, item.quantity + 1)
                        }
                        className="rounded border p-1 disabled:opacity-40"
                      >
                        <Plus size={16} />
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => void removeItem(product._id)}
                        className="ml-2 flex items-center gap-1 text-sm text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </div>

                  <p className="font-semibold">
                    {formatPrice(product.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          <aside className="h-fit rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-5 flex justify-between text-sm">
              <span className="text-gray-500">Items</span>
              <span>{cart.itemCount}</span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">
                {formatPrice(cart.subtotal)}
              </span>
            </div>

            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Shipping charges, if any, are calculated at checkout.
            </p>

            <Link
              to="/checkout"
              className="mt-6 block rounded-lg bg-black px-4 py-3 text-center font-medium text-white hover:bg-gray-800"
            >
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
