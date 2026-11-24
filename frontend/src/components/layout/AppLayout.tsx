import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getCart } from "../../services/cartApi";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadCartCount = async () => {
      if (!user || user.role !== "user") {
        setCartCount(0);
        return;
      }

      try {
        const cart = await getCart();

        if (active) {
          setCartCount(cart.itemCount ?? 0);
        }
      } catch {
        if (active) {
          setCartCount(0);
        }
      }
    };

    void loadCartCount();

    const handleCartUpdate = () => {
      void loadCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdate);

    return () => {
      active = false;
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role === "admin";
  const isSalesperson = user?.role === "salesperson";
  const isCustomer = user?.role === "user";

  const navLinkClass = (isActive: boolean) =>
    `border-b-2 pb-1 transition-colors ${
      isActive
        ? "border-blue-600 font-semibold text-blue-700"
        : "border-transparent text-gray-700 hover:border-blue-300 hover:text-blue-700"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* <Link
            to="/"
            className="text-xl font-bold tracking-tight text-blue-700"
          >
            MERN Store
          </Link> */}

          <Link
            to={isAdmin ? "/admin" : isSalesperson ? "/sales" : "/"}
            className="text-xl font-bold tracking-tight text-blue-700"
          >
            MERN Store
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            {/* <NavLink
              to="/"
              end
              className={({ isActive }) => navLinkClass(isActive)}
            >
              Home
            </NavLink> */}

            {!isAdmin && !isSalesperson && (
              <NavLink
                to="/"
                end
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Home
              </NavLink>
            )}

            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  end
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/admin/products"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Products & Inventory
                </NavLink>

                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Orders
                </NavLink>

                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  User Management
                </NavLink>
              </>
            )}

            {isSalesperson && (
              <>
                <NavLink
                  to="/sales"
                  end
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Dashboard
                </NavLink>

                <NavLink
                  to="/admin/products"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  My Products
                </NavLink>

                <NavLink
                  to="/sales/orders"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Sales Orders
                </NavLink>
              </>
            )}

            {isCustomer && (
              <>
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Wishlist
                </NavLink>
                <NavLink
                  to="/cart"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Cart
                  <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                    {cartCount}
                  </span>
                </NavLink>

                <NavLink
                  to="/orders"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  My Orders
                </NavLink>
              </>
            )}

            {user ? (
              <>
                <span className="hidden text-gray-500 sm:inline">
                  Hi, {user.name}
                </span>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `rounded-lg border-b-2 px-3 py-2 transition-colors ${
                      isActive
                        ? "border-blue-800 bg-blue-700 text-white"
                        : "border-transparent bg-blue-600 text-white hover:bg-blue-700"
                    }`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <Outlet />

      <footer className="mt-16 border-t bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} MERN Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
