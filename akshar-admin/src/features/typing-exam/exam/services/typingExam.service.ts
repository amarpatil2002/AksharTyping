import { apiClient } from "../../../../services/api";

import type {
  CreateTypingExamPayload,
  UpdateTypingExamPayload,
  TypingExam,
  TypingExamFilters,
  PaginationMeta,
  GetTypingExamData,
} from "../types/typingExam.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ExamListResponse {
  exams: TypingExam[];
  pagination: PaginationMeta;
}

const BASE_URL = "/admin/typing-exam";

export const getExams = async (filters: TypingExamFilters = {}) => {
  const response = await apiClient.get<ApiResponse<ExamListResponse>>(
    BASE_URL,
    { params: filters },
  );

  return response.data.data;
};

export const getExamById = async (examId: string) => {
  const response = await apiClient.get<ApiResponse<GetTypingExamData>>(
    `${BASE_URL}/${examId}`,
  );

  return response.data.data.exam;
};

export const createExam = async (payload: CreateTypingExamPayload) => {
  const response = await apiClient.post<ApiResponse<TypingExam>>(
    BASE_URL,
    payload,
  );

  return response.data.data;
};

export const updateExam = async (
  examId: string,
  payload: UpdateTypingExamPayload,
) => {
  const response = await apiClient.patch<ApiResponse<TypingExam>>(
    `${BASE_URL}/${examId}`,
    payload,
  );

  return response.data.data;
};

export const deleteExam = async (examId: string) => {
  await apiClient.delete(`${BASE_URL}/${examId}`);
};

export const updateExamStatus = async (
  examId: string,
  status: TypingExam["status"],
) => {
  const response = await apiClient.patch<ApiResponse<TypingExam>>(
    `${BASE_URL}/${examId}/status`,
    { status },
  );

  return response.data.data;
};
