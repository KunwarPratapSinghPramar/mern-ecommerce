import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/useAuth";

const SAVED_EMAILS_KEY = "mern-store-saved-login-emails";

const getSavedEmails = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_EMAILS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const Login = () => {
  const { login, user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedEmails] = useState<string[]>(getSavedEmails);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) {
    return <div className="p-10 text-center">Checking your session...</div>;
  }

  if (user) {
    const redirectPath =
      user.role === "admin"
        ? "/admin"
        : user.role === "salesperson"
          ? "/sales"
          : "/";

    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await login(normalizedEmail, password);

      const updatedEmails = [
        normalizedEmail,
        ...getSavedEmails().filter(
          (savedEmail) => savedEmail !== normalizedEmail,
        ),
      ].slice(0, 10);

      localStorage.setItem(SAVED_EMAILS_KEY, JSON.stringify(updatedEmails));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to your MERN E-Commerce account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              list="saved-login-emails"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <datalist id="saved-login-emails">
              {savedEmails.map((savedEmail) => (
                <option key={savedEmail} value={savedEmail} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline"
          >
            Create account
          </Link>
        </p>

        <Link
          to="/"
          className="mt-5 block text-center text-sm text-gray-500 hover:text-gray-800"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
};

export default Login;
