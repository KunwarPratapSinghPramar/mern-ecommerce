// import { Link } from "react-router-dom";
// import { Package, ClipboardList, LayoutDashboard } from "lucide-react";

// const dashboardItems = [
//   {
//     title: "Manage Products",
//     description: "Add, edit and delete products in your store.",
//     path: "/admin/products",
//     icon: Package,
//   },
//   {
//     title: "Manage Orders",
//     description: "View customer orders and update their status.",
//     path: "/admin/orders",
//     icon: ClipboardList,
//   },
// ];

// export default function AdminDashboard() {
//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="mx-auto max-w-6xl">
//         <div className="mb-8">
//           <div className="mb-2 flex items-center gap-3">
//             <LayoutDashboard size={28} />
//             <h1 className="text-3xl font-bold text-gray-900">
//               Admin Dashboard
//             </h1>
//           </div>
//           <p className="text-gray-600">
//             Manage your store, products and customer orders.
//           </p>
//         </div>

//         <div className="grid gap-6 sm:grid-cols-2">
//           {dashboardItems.map((item) => {
//             const Icon = item.icon;

//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
//               >
//                 <Icon size={32} className="mb-4 text-blue-600" />

//                 <h2 className="mb-2 text-xl font-semibold">{item.title}</h2>

//                 <p className="text-gray-600">{item.description}</p>
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, type AdminStats } from "../services/adminStatsApi";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getAdminStats();

        if (active) {
          setStats(result);
        }
      } catch {
        if (active) {
          setError("Unable to load dashboard statistics.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      active = false;
    };
  }, []);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  const statusLabels: Record<string, string> = {
    placed: "Placed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    payment_pending: "Payment Pending",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your store's sales and orders.
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading dashboard...</p>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {formatPrice(stats.totalSales)}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                From successfully paid orders
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>

              <p className="mt-3 text-3xl font-bold text-gray-900">
                {stats.totalOrders}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                All orders in the store
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-gray-900">
              Orders by Status
            </h2>

            {Object.keys(stats.ordersByStatus).length === 0 ? (
              <p className="text-gray-500">No orders found.</p>
            ) : (
              <div className="divide-y">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between py-4"
                  >
                    <span className="font-medium capitalize text-gray-700">
                      {statusLabels[status] ?? status.replace(/_/g, " ")}
                    </span>

                    <span className="rounded-full bg-gray-100 px-4 py-1 font-semibold text-gray-800">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                to="/admin/products"
                className="rounded-lg border bg-white p-5 font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                Manage Products
              </Link>

              <Link
                to="/admin/orders"
                className="rounded-lg border bg-white p-5 font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                Manage Orders
              </Link>

              <Link
                to="/admin/users"
                className="rounded-lg border bg-white p-5 font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                Manage Users
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
