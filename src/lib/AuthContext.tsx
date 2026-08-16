import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ApiUser, api } from "./api";

interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  login: (token: string, user: ApiUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kr_token"));
  const [user, setUser] = useState<ApiUser | null>(() => {
    const raw = localStorage.getItem("kr_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!token) return;
    // Session validation on app mount using /api/auth/me
    api.validateSession()
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        }
      })
      .catch((err: any) => {
        // Only clear token if server explicitly invalidated auth (401/403 or user not found)
        const isUnauthorized = err?.status === 401 || err?.status === 403 || (err?.error && err.error.includes("User not found"));
        if (isUnauthorized) {
          console.warn("Session verification failed, logging out stale session:", err);
          setToken(null);
          setUser(null);
          localStorage.removeItem("kr_token");
          localStorage.removeItem("kr_user");
        } else {
          console.info("Server unreachable or network offline; keeping local session active.", err);
        }
      });
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("kr_token", token);
    else localStorage.removeItem("kr_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("kr_user", JSON.stringify(user));
    else localStorage.removeItem("kr_user");
  }, [user]);

  function login(newToken: string, newUser: ApiUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    // Clear backend HTTP-only session cookie
    api.logout().catch((err) => console.error("Failed to clear backend session cookie:", err));
    setToken(null);
    setUser(null);
    localStorage.removeItem("kr_token");
    localStorage.removeItem("kr_user");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
