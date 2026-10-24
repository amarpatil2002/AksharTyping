import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const message = data.message ?? data.error;

      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }

    if (!error.response) {
      return "Unable to connect to the server. Please try again.";
    }

    return `Request failed (${error.response.status}).`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
