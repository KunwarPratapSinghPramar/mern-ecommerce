import { Link } from "react-router-dom";

export default function SalesDashboard() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Manage your own products and view orders containing your products.
          </p>
        </div>

        <Link
          to="/admin/products"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Add New Product
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          to="/admin/products"
          className="rounded-xl border bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl text-blue-700">
            <span aria-hidden="true">📦</span>
          </div>

          <h2 className="text-lg font-semibold">My Products</h2>
          <p className="mt-2 text-sm text-gray-600">
            Add new products, edit existing listings, manage stock and delete
            your own products.
          </p>

          <span className="mt-5 inline-block font-semibold text-blue-700">
            Manage My Products →
          </span>
        </Link>

        <Link
          to="/sales/orders"
          className="rounded-xl border bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-xl text-green-700">
            <span aria-hidden="true">🧾</span>
          </div>

          <h2 className="text-lg font-semibold">My Sales Orders</h2>
          <p className="mt-2 text-sm text-gray-600">
            View customer orders containing your products. Only Admin can change
            order status or perform order actions.
          </p>

          <span className="mt-5 inline-block font-semibold text-blue-700">
            View My Orders →
          </span>
        </Link>
      </div>
    </main>
  );
}
