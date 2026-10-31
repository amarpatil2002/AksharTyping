import { apiClient } from "../../../../services/api";

import type {
  CreateTypingPassagePayload,
  UpdateTypingPassagePayload,
  TypingPassage,
  TypingPassageFilters,
  TypingPassageListResponse,
  TypingPassageStatus,
} from "../types/passage.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE_URL = "/admin/typing-exam";

// Get passages for an exam
export const getPassages = async (
  examId: string,
  filters: TypingPassageFilters = {},
) => {
  const response = await apiClient.get<ApiResponse<TypingPassageListResponse>>(
    `${BASE_URL}/${examId}/passages`,
    {
      params: filters,
    },
  );

  return response.data.data;
};

// Get single passage
export const getPassageById = async (
  examId: string,
  passageId: string,
): Promise<TypingPassage> => {
  const response = await apiClient.get(
    `/admin/typing-exam/${examId}/passages/${passageId}`,
  );

  return response.data.data.passage;
};

// Create passage
// Create passage
export const createPassage = async (
  examId: string,
  payload: CreateTypingPassagePayload,
) => {
  const response = await apiClient.post<ApiResponse<TypingPassage>>(
    `${BASE_URL}/${examId}/passages`,
    payload,
  );

  return response.data.data;
};

// Update passage
export const updatePassage = async (
  examId: string,
  passageId: string,
  payload: UpdateTypingPassagePayload,
) => {
  const response = await apiClient.patch<ApiResponse<TypingPassage>>(
    `${BASE_URL}/${examId}/passages/${passageId}`,
    payload,
  );

  return response.data.data;
};

// Delete passage
export const deletePassage = async (examId: string, passageId: string) => {
  await apiClient.delete(`${BASE_URL}/${examId}/passages/${passageId}`);
};

// Update passage status
export const updatePassageStatus = async (
  examId: string,
  passageId: string,
  status: TypingPassageStatus,
) => {
  const response = await apiClient.patch<ApiResponse<TypingPassage>>(
    `${BASE_URL}/${examId}/passages/${passageId}/status`,
    { status },
  );

  return response.data.data;
};
