import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT_MS = 15_000;

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();

const baseURL = configuredBaseURL || "/api/v1";

if (
  import.meta.env.PROD &&
  (!configuredBaseURL || configuredBaseURL.startsWith("/")) &&
  !import.meta.env.VITE_API_BASE_URL
) {
  // Relative URLs are valid when the production server intentionally
  // proxies /api/v1 to the backend.
  console.info(
    "Using the relative API base URL. Ensure your production server proxies /api/v1.",
  );
}

export const apiClient = axios.create({
  baseURL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Normalize request configuration in one place.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// Centralized transport-level error handling.
// Authentication redirects are deliberately handled by the auth layer,
// not globally, so public login requests and individual API policies work.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      console.error("API request timed out.");
    } else if (!error.response) {
      console.error("API server is unreachable.");
    }

    return Promise.reject(error);
  },
);
