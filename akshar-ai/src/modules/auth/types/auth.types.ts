export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
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

export interface RequestOtpPayload {
  email: string;
  purpose: "verify_email" | "password_reset";
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;

  requestOtp: (payload: RequestOtpPayload) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
}
