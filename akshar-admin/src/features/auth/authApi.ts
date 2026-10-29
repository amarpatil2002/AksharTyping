import { apiClient } from "../../services/apiClient";
import type { AdminAuthResponse } from "./auth.types";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export async function loginAdmin(
  payload: AdminLoginPayload,
): Promise<AdminAuthResponse> {
  const response = await apiClient.post<AdminAuthResponse>(
    "/admin/auth/login",
    payload,
  );

  return response.data;
}

export async function getAdminSession(): Promise<AdminAuthResponse> {
  const response = await apiClient.get<AdminAuthResponse>("/admin/auth/me");

  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  await apiClient.post("/admin/auth/logout");
}
