import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { refreshAccessToken, setAccessToken } from "../../../shared/api/axios";

import { authService } from "../services/authService";

import type {
  AuthContextValue,
  AuthStatus,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RequestOtpPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from "../types/auth.types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Inside AuthProvider:
  const sessionGeneration = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const generation = sessionGeneration.current;

    async function restoreSession() {
      try {
        await refreshAccessToken();

        if (cancelled || generation !== sessionGeneration.current) return;

        const currentUser = await authService.getCurrentUser();

        if (cancelled || generation !== sessionGeneration.current) return;

        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        if (cancelled || generation !== sessionGeneration.current) return;

        setAccessToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authService.login(payload);

    setAccessToken(result.accessToken);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const requestOtp = useCallback(async (payload: RequestOtpPayload) => {
    await authService.requestOtp(payload);
  }, []);

  const verifyOtp = useCallback(async (payload: VerifyOtpPayload) => {
    await authService.verifyOtp(payload);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload);
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    await authService.resetPassword(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Send logout request first.
      await authService.logout();
    } finally {
      // Clear local authentication state after the request.
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        requestOtp,
        verifyOtp,
        register,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
