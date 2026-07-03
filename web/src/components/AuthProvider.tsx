"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface AuthUser {
  phone: string;
  name: string;
  plan: "free" | "pro" | "family";
  effectivePlan: "free" | "pro" | "family";
  planActive: boolean;
  planExpiry: string | null;
  createdAt: string;
  billChecksToday: number;
  refNos: { refNo: string; company: string; label?: string }[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  login: (phone: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    phone: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Load token from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("billbachat_token");
    if (saved) {
      setToken(saved);
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (tok: string) => {
    try {
      const res = await fetch("/billbachat/api/auth/me", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        // Token invalid — clear it
        localStorage.removeItem("billbachat_token");
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem("billbachat_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (phone: string, _name?: string) => {
      try {
        const res = await fetch("/billbachat/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("billbachat_token", data.token);
          setToken(data.token);
          await fetchUser(data.token);
          return { success: true };
        }
        return { success: false, error: data.error };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [fetchUser]
  );

  const signup = useCallback(
    async (phone: string, name: string) => {
      try {
        const res = await fetch("/billbachat/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, name }),
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("billbachat_token", data.token);
          setToken(data.token);
          await fetchUser(data.token);
          return { success: true };
        }
        return { success: false, error: data.error };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("billbachat_token");
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (token) await fetchUser(token);
  }, [token, fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        signup,
        logout,
        refresh,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
