import { appConfig } from "../../app/config";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!appConfig.apiBaseUrl) {
    throw new Error("VITE_API_URL is not configured.");
  }
  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message ?? "Request failed.", response.status);
  }
  return data as T;
}
