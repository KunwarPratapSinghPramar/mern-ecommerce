import { useEffect, useState, type ReactNode } from "react";

import api from "../services/api";
import { AuthContext } from "./AuthContext";
import type { User, AuthResponse } from "../types/auth";

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get<User | { user: User }>("/auth/me");

        const currentUser =
          "user" in response.data ? response.data.user : response.data;

        setUser(currentUser);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("token", response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
