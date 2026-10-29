import { apiClient } from "../../../services/apiClient";

import type {
  CreateTypingExamConfigPayload,
  TypingExamConfig,
} from "../types/config.types";

const BASE_PATH = "/admin/typing-exam/configs";

export interface ConfigPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetConfigurationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  language?: string;
}

export interface ConfigurationsListResponse {
  success: boolean;
  message?: string;
  data: {
    items: TypingExamConfig[];
    pagination: ConfigPagination;
  };
}

export interface ConfigDetailResponse {
  success: boolean;
  message?: string;
  data: TypingExamConfig;
}

export interface ConfigActionResponse {
  success: boolean;
  message?: string;
  data?: TypingExamConfig;
}

/**
 * List configurations with optional search, status, language,
 * and pagination filters.
 *
 * GET /typing-exam/configs
 */
export async function getConfigurations(
  params: GetConfigurationsParams = {},
): Promise<ConfigurationsListResponse> {
  const response = await apiClient.get<ConfigurationsListResponse>(BASE_PATH, {
    params,
  });

  return response.data;
}

/**
 * Get one configuration by ID.
 *
 * GET /typing-exam/configs/:configId
 *
 * Assumes the controller responds with:
 * { success: true, data: configuration }
 */
export async function getConfigurationById(
  configId: string,
): Promise<TypingExamConfig> {
  if (!configId) {
    throw new Error("Configuration ID is required.");
  }

  const response = await apiClient.get<ConfigDetailResponse>(
    `${BASE_PATH}/${encodeURIComponent(configId)}`,
  );

  if (!response.data?.data) {
    throw new Error("Configuration data was not returned by the server.");
  }

  return response.data.data;
}

/**
 * Create a configuration.
 *
 * POST /typing-exam/configs
 */
export async function createConfiguration(
  payload: CreateTypingExamConfigPayload,
): Promise<ConfigActionResponse> {
  const response = await apiClient.post<ConfigActionResponse>(
    BASE_PATH,
    payload,
  );

  return response.data;
}

/**
 * Update an existing configuration.
 *
 * PATCH /typing-exam/configs/:configId
 */
export async function updateConfiguration(
  configId: string,
  payload: Partial<CreateTypingExamConfigPayload>,
): Promise<ConfigActionResponse> {
  if (!configId) {
    throw new Error("Configuration ID is required.");
  }

  const response = await apiClient.patch<ConfigActionResponse>(
    `${BASE_PATH}/${encodeURIComponent(configId)}`,
    payload,
  );

  return response.data;
}

/**
 * Archive a configuration.
 *
 * POST /typing-exam/configs/:configId/archive
 */
export async function archiveConfiguration(
  configId: string,
): Promise<ConfigActionResponse> {
  if (!configId) {
    throw new Error("Configuration ID is required.");
  }

  const response = await apiClient.post<ConfigActionResponse>(
    `${BASE_PATH}/${encodeURIComponent(configId)}/archive`,
  );

  return response.data;
}
