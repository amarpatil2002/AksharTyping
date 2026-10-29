import { createContext } from "react";
import type { Admin } from "./auth.types";

export type AuthStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error";

export interface AuthContextValue {
  admin: Admin | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
