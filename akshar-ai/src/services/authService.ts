import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

async function post<T>(path: string, payload: unknown): Promise<T> {
  if (!API_URL) {
    throw new Error("API URL is missing. Configure VITE_API_URL in .env.");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that your backend is running.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : `Request failed (${response.status}). Please try again.`;

    throw new Error(message);
  }

  return data as T;
}

export function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/register", payload);
}

export function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return post<AuthResponse>("/auth/login", payload);
}
