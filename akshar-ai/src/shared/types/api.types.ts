export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
