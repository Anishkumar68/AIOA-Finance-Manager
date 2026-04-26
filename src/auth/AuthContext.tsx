import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { clearTokens, getTokens, setTokens } from "./authStorage";

type User = { id: number; name: string; email: string; is_active: boolean };

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerAndLogin: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = getTokens();
      if (!tokens) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await api.me();
        if (!cancelled) {
          setUser(me);
          setLoading(false);
        }
      } catch {
        const refreshed = await api.refreshAccessToken();
        if (!refreshed) {
          clearTokens();
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        try {
          const me2 = await api.me();
          if (!cancelled) {
            setUser(me2);
            setLoading(false);
          }
        } catch {
          clearTokens();
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setUser(null);
      setLoading(false);
    }

    window.addEventListener("aioa:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("aioa:auth-expired", handleAuthExpired);
  }, []);

  async function loginWithPassword(email: string, password: string) {
    const res = await api.login(email, password);
    setTokens({ accessToken: res.access_token, refreshToken: res.refresh_token });
    const me = await api.me();
    setUser(me);
  }

  async function registerAndLogin(name: string, email: string, password: string) {
    await api.register(name, email, password);
    await loginWithPassword(email, password);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  const value = useMemo<AuthState>(() => {
    return {
      user,
      loading,
      isAuthenticated: !!user,
      loginWithPassword,
      registerAndLogin,
      logout
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
