import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { useAuth } from "./context/useAuth";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import SalesOrders from "./pages/SalesOrders";
import AdminUsers from "./pages/AdminUsers";
import SalesDashboard from "./pages/SalesDashboard";
import Wishlist from "./pages/Wishlist";

function RoleBasedHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center">Checking your session...</div>;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === "salesperson") {
    return <Navigate to="/sales" replace />;
  }

  return <Home />;
}

function NotFound() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
      <p className="mt-2 text-gray-500">
        The page you are looking for does not exist.
      </p>
      <Link
        to="/"
        className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
      >
        Return to Store
      </Link>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Role-based home */}
            <Route path="/" element={<RoleBasedHome />} />

            {/* Public pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products/:id" element={<ProductDetails />} />

            {/* Customer only */}
            <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>

            {/* Admin and Sales Person */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin", "salesperson"]} />
              }
            >
              <Route path="/admin/products" element={<AdminProducts />} />
            </Route>

            {/* Sales Person only */}
            <Route element={<ProtectedRoute allowedRoles={["salesperson"]} />}>
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/sales/orders" element={<SalesOrders />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
