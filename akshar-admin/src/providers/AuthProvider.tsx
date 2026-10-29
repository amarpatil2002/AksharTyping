import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";

import {
  getAdminSession,
  loginAdmin as loginAdminApi,
  logoutAdmin as logoutAdminApi,
} from "../features/auth/authApi";

import { AuthContext, type AuthStatus } from "../features/auth/AuthContext";
import type { Admin } from "../features/auth/auth.types";

interface AuthProviderProps {
  children: ReactNode;
}

function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  const refreshSession = useCallback(async () => {
    setStatus("checking");

    try {
      const response = await getAdminSession();

      setAdmin(response.data.admin);
      setStatus("authenticated");
    } catch (error: unknown) {
      if (isUnauthorized(error)) {
        setAdmin(null);
        setStatus("unauthenticated");
        return;
      }

      // A network error or server failure does not prove
      // that the server-side session has expired.
      setStatus("error");
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const response = await getAdminSession();

        if (!active) return;

        setAdmin(response.data.admin);
        setStatus("authenticated");
      } catch (error: unknown) {
        if (!active) return;

        if (isUnauthorized(error)) {
          setAdmin(null);
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    }

    void initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginAdminApi({ email, password });

    // The browser receives the HttpOnly cookie from the server.
    // React stores only the admin profile, never the session ID.
    setAdmin(response.data.admin);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdminApi();
    } finally {
      // Clear the UI state even if the logout request fails.
      // A failed request may leave the server session alive until
      // it is revoked or expires, so callers should handle errors.
      setAdmin(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({
      admin,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "checking",
      login,
      logout,
      refreshSession,
    }),
    [admin, status, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
