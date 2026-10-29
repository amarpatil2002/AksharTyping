export interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
  data: {
    admin: Admin;
  };
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
}
