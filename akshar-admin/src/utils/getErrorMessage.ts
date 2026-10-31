import axios from "axios";

interface ApiValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: ApiValidationError[];
}

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong.",
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const response = error.response?.data;

    if (response?.errors?.length) {
      return response.errors.map((item) => item.message).join("\n");
    }

    return response?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
