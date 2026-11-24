import { useEffect, useState } from "react";
import { getSalesOrders } from "../services/salesApi";
import type { AdminOrder } from "../types/order";

const SalesOrders = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getSalesOrders(page);

        if (active) {
          setOrders(result.orders);
          setTotalPages(Math.max(1, result.pagination.totalPages));
        }
      } catch (err: any) {
        if (active) {
          setError(
            err.response?.data?.message || "Failed to load sales orders",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, [page]);

  if (loading) {
    return <div className="p-8 text-center">Loading sales orders...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Sales Orders</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {!error && orders.length === 0 && (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          No orders containing your products yet.
        </div>
      )}

      <div className="space-y-5">
        {orders.map((order) => {
          const customer =
            typeof order.user === "string" ? "Customer" : order.user.name;

          return (
            <section
              key={order._id}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm">Customer: {customer}</p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    ₹{order.total.toLocaleString("en-IN")}
                  </p>
                  <p className="text-sm capitalize text-gray-600">
                    {order.status.replace("_", " ")}
                  </p>
                  <p className="text-sm capitalize text-gray-500">
                    Payment: {order.paymentStatus}
                  </p>
                </div>
              </div>

              <div className="divide-y">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.product}-${index}`}
                    className="flex items-center gap-4 py-3"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="font-medium">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-4 text-sm">
                <p className="font-medium">Shipping address</p>
                <p className="mt-1 text-gray-600">
                  {order.shippingAddress.fullName},{" "}
                  {order.shippingAddress.addressLine1},{" "}
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                  {order.shippingAddress.postalCode}
                </p>
              </div>
            </section>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
};

export default SalesOrders;
