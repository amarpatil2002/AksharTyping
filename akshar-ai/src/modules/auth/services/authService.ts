import { api } from "../../../shared/api/axios";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth.types";

type AuthResponse = {
  user: AuthUser;
};

type MessageResponse = {
  message: string;
};

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      "/api/v1/auth/login",
      payload,
    );

    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(
      "/api/v1/auth/register",
      payload,
    );

    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/api/v1/auth/refresh");

    return response.data;
  },

  me: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>("/api/v1/auth/me");

    return response.data;
  },

  logout: async (): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>("/api/v1/auth/logout");

    return response.data;
  },
};
