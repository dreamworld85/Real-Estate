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
    if (token) {
      api.fetchMyProfile()
        .then((data) => {
          setUser(data);
        })
        .catch((err) => console.error("Failed to sync user profile on mount:", err));
    }
  }, [token]);

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
    setToken(null);
    setUser(null);
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
