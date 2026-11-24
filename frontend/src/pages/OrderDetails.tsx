import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import { getMyOrderById } from "../services/orderApi";
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

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid order ID.");
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        setOrder(await getMyOrderById(id));
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Unable to load order details.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600">{error || "Order not found."}</p>
        <Link to="/orders" className="mt-4 inline-block underline">
          Back to My Orders
        </Link>
      </div>
    );
  }

  const address = order.shippingAddress;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to My Orders
        </Link>

        <div className="rounded-xl border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
            <div>
              <h1 className="text-xl font-bold">Order Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                #{order._id.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Placed {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status]}`}
            >
              {formatStatus(order.status)}
            </span>
          </div>

          <section className="py-6">
            <h2 className="mb-4 font-semibold">Products</h2>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={`${item.product}-${index}`}
                  className="flex items-center gap-4 border-b pb-4"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                      <Package className="text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <p className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 border-t py-6 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 font-semibold">Delivery Address</h2>
              <div className="text-sm leading-6 text-gray-600">
                <p>{address.fullName}</p>
                <p>{address.phone}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-semibold">Payment Information</h2>
              <p className="text-sm text-gray-600">
                Method: {order.paymentMethod.toUpperCase()}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Payment: {formatStatus(order.paymentStatus)}
              </p>
            </div>
          </section>

          <section className="border-t pt-5">
            <h2 className="mb-4 font-semibold">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>

              <div className="flex justify-between border-t pt-4 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
