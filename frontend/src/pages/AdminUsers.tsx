import { useEffect, useState } from "react";
import api from "../services/api";

type UserRole = "admin" | "salesperson" | "user";

interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users");
      const data = response.data;
      setUsers(Array.isArray(data) ? data : (data.users ?? []));
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const changeRole = async (userId: string, role: UserRole) => {
    try {
      setSavingId(userId);
      setError("");
      setMessage("");

      await api.patch(`/admin/users/${userId}/role`, { role });

      setUsers((current) =>
        current.map((user) => (user._id === userId ? { ...user, role } : user)),
      );

      setMessage("User role updated successfully.");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to update user role.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Promote registered customers to Sales Person or change their role.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-gray-600">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-gray-600">No users found.</p>
        ) : (
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4">Name</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Current role</th>
                <th className="px-5 py-4">Change role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-5 py-4 font-medium">{user.name}</td>
                  <td className="px-5 py-4">{user.email}</td>
                  <td className="px-5 py-4 capitalize">{user.role}</td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      disabled={savingId === user._id}
                      onChange={(event) =>
                        void changeRole(
                          user._id,
                          event.target.value as UserRole,
                        )
                      }
                      className="rounded-lg border px-3 py-2 disabled:opacity-50"
                    >
                      <option value="user">User</option>
                      <option value="salesperson">Sales Person</option>
                      <option value="admin">Admin</option>
                    </select>
                    {savingId === user._id && (
                      <span className="ml-2 text-xs text-gray-500">
                        Saving...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        type="button"
        onClick={() => void loadUsers()}
        className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Refresh users
      </button>
    </main>
  );
}
