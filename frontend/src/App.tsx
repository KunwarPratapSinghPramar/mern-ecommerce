
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/useAuth";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <h1 className="p-10 text-xl">Loading...</h1>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10 text-gray-900">
      <h1 className="mb-4 text-3xl font-bold">
        MERN E-Commerce Store
      </h1>

      {user ? (
        <div>
          <p>Welcome, {user.name}!</p>
          <p>Your role: {user.role}</p>

          {user.role === "admin" && (
            <a
              href="/admin"
              className="mt-4 block text-blue-600 hover:underline"
            >
              Go to Admin Dashboard
            </a>
          )}

          <button
            onClick={logout}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p>You are not logged in.</p>
          <div className="flex gap-4">
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
            <a href="/register" className="text-blue-600 hover:underline">
              Create account
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="mt-3">Welcome, {user?.name}.</p>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
