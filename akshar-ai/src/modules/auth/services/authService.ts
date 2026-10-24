import { api, getAccessToken, plainApi } from "../../../shared/api/axios";

import type {
  ApiResponse,
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RequestOtpPayload,
  VerifyOtpPayload,
} from "../types/auth.types";

export const authService = {
  async requestOtp(payload: RequestOtpPayload) {
    const response = await plainApi.post("/api/v1/auth/request-otp", payload);

    return response.data;
  },

  async verifyOtp(payload: VerifyOtpPayload) {
    const response = await plainApi.post("/api/v1/auth/verify-otp", payload);

    return response.data;
  },

  async register(payload: RegisterPayload) {
    const response = await plainApi.post("/api/v1/auth/register", payload);

    return response.data;
  },

  async login(payload: LoginPayload) {
    const response = await plainApi.post<ApiResponse<LoginResponse>>(
      "/api/v1/auth/login",
      payload,
    );

    return response.data.data;
  },

  async refresh() {
    const response = await plainApi.post<
      ApiResponse<{
        accessToken: string;
        tokenType: "Bearer";
        expiresIn: number;
      }>
    >("/api/v1/auth/refresh");

    return response.data.data;
  },

  async getCurrentUser() {
    const response = await api.get<ApiResponse<AuthUser>>("/api/v1/auth/me");

    return response.data.data;
  },

  async logout() {
    await plainApi.post("/api/v1/auth/logout");
  },
};
