export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface ApiMessage {
  message: string;
}
