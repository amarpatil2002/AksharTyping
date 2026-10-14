export interface ApiError {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
