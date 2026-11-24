import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

import {
  cancelAdminOrder,
  getAdminOrders,
  updateAdminOrderStatus,
  markCodOrderPaid,
} from "../services/adminOrderApi";

import type { AdminOrder, OrderStatus } from "../types/order";

const statuses: OrderStatus[] = [
  "payment_pending",
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

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

const getCustomer = (order: AdminOrder) => {
  if (typeof order.user === "string") {
    return { name: "Customer", email: order.user };
  }

  return order.user;
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });

      setOrders(result.orders);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!selectedOrder) return;

    setActionLoading(true);
    setError("");

    try {
      const updated = await updateAdminOrderStatus(selectedOrder._id, status);

      setSelectedOrder(updated);
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;

    const reason = window.prompt("Enter the reason for cancelling this order:");

    if (reason === null) return;

    if (!reason.trim()) {
      setError("Cancellation reason is required.");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      const updated = await cancelAdminOrder(selectedOrder._id, reason.trim());

      setSelectedOrder(updated);
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCodPaid = async () => {
    if (!selectedOrder) return;

    if (
      selectedOrder.paymentMethod !== "cod" ||
      selectedOrder.paymentStatus !== "pending" ||
      selectedOrder.status === "cancelled"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Confirm that cash has been collected from the customer and mark this COD order as paid?",
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const updated = await markCodOrderPaid(selectedOrder._id);

      setSelectedOrder(updated);
      await loadOrders();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to mark COD order as paid.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage customer orders and fulfillment.
            </p>
          </div>

          <button
            onClick={() => void loadOrders()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search orders..."
              className="w-full rounded-lg border bg-white py-3 pl-10 pr-4 outline-none focus:border-black"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border bg-white px-3 py-3 outline-none focus:border-black"
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="mx-auto mb-3" size={36} />
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Order</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {orders.map((order) => {
                    const customer = getCustomer(order);

                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-gray-500">
                            {customer.email}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium">
                          {formatPrice(order.total)}
                        </td>

                        <td className="px-5 py-4">
                          <p className="capitalize">{order.paymentMethod}</p>
                          <p className="text-xs text-gray-500">
                            {formatStatus(order.paymentStatus)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status]}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-1 rounded-lg border px-3 py-2 hover:bg-gray-100"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border bg-white p-2 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border bg-white p-2 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
              <div>
                <h2 className="font-bold">
                  Order #{selectedOrder._id.slice(-8).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-500">
                  {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <h3 className="mb-3 font-semibold">Order items</h3>

                {selectedOrder.items.map((item, index) => (
                  <div
                    key={`${item.product}-${index}`}
                    className="flex items-center justify-between border-b py-3"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="mb-3 font-semibold">Shipping address</h3>
                <div className="rounded-lg bg-gray-50 p-4 text-sm leading-6">
                  <p>{selectedOrder.shippingAddress.fullName}</p>
                  <p>{selectedOrder.shippingAddress.phone}</p>
                  <p>{selectedOrder.shippingAddress.addressLine1}</p>
                  {selectedOrder.shippingAddress.addressLine2 && (
                    <p>{selectedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {selectedOrder.shippingAddress.city},{" "}
                    {selectedOrder.shippingAddress.state}{" "}
                    {selectedOrder.shippingAddress.postalCode}
                  </p>
                  <p>{selectedOrder.shippingAddress.country}</p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold">Payment summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatPrice(selectedOrder.shippingFee)}</span>
                  </div>

                  <div className="flex justify-between border-t pt-3 text-base font-bold">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>

                  {selectedOrder.paymentMethod === "cod" &&
                    selectedOrder.paymentStatus === "pending" &&
                    selectedOrder.status !== "cancelled" && (
                      <div className="border-t pt-4">
                        <p className="mb-3 text-sm text-gray-600">
                          This order is awaiting cash payment.
                        </p>

                        <button
                          type="button"
                          onClick={() => void handleMarkCodPaid()}
                          disabled={actionLoading}
                          className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading
                            ? "Updating payment..."
                            : "Mark COD as Paid"}
                        </button>
                      </div>
                    )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold">Update order status</h3>

                <select
                  value={selectedOrder.status}
                  disabled={
                    actionLoading || selectedOrder.status === "cancelled"
                  }
                  onChange={(event) =>
                    void handleStatusUpdate(event.target.value as OrderStatus)
                  }
                  className="w-full rounded-lg border p-3 disabled:bg-gray-100"
                >
                  {statuses
                    .filter((status) => status !== "cancelled")
                    .map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                </select>

                {selectedOrder.status !== "cancelled" &&
                  selectedOrder.status !== "delivered" && (
                    <button
                      disabled={actionLoading}
                      onClick={() => void handleCancel()}
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading ? "Please wait..." : "Cancel order"}
                    </button>
                  )}

                {actionLoading && (
                  <p className="mt-2 text-sm text-gray-500">
                    Saving changes...
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
