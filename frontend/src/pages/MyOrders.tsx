import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Eye, RefreshCw } from "lucide-react";
import { getMyOrders } from "../services/orderApi";
import type { AdminOrder, OrderStatus } from "../types/order";

const statusColors: Record<OrderStatus, string> = {
  payment_pending: "bg-yellow-100 text-yellow-800",
  placed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const formatStatus = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);

export default function MyOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      setOrders(await getMyOrders());
    } catch (err: any) {
      setError(err.response?.data?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your purchases and order status.
            </p>
          </div>

          <button
            onClick={() => void loadOrders()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={44} />
            <h2 className="text-lg font-semibold">No orders yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your purchases will appear here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-sm text-white"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {order.items.length} product type(s)
                    </p>
                    <p className="mt-1 font-bold">{formatPrice(order.total)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {order.paymentMethod.toUpperCase()} ·{" "}
                      {formatStatus(order.paymentStatus)}
                    </p>
                  </div>

                  <Link
                    to={`/orders/${order._id}`}
                    className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    <Eye size={16} />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
