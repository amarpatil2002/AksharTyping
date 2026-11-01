import { api } from "../../../shared/api/axios";

import type {
  ApiResponse,
  MongoId,
  TypingExamFilters,
  TypingExamListResponse,
  TypingExamDetailResponse,
  TypingPassageFilters,
  TypingPassageListResponse,
  StartTypingAttemptResponse,
  TypingAttemptFilters,
  TypingAttemptListResponse,
  UpdateTypingProgressPayload,
  UpdateTypingProgressResponse,
  SubmitTypingAttemptPayload,
  SubmitTypingAttemptResponse,
  TypingResultResponse,
} from "../types/typing.types";

// ==========================================
// BASE URL
// ==========================================

const BASE_URL = "/api/v1/typing-exam";

// ==========================================
// PUBLISHED EXAMS
// ==========================================

export const getPublishedExams = async (
  filters: TypingExamFilters = {},
): Promise<TypingExamListResponse> => {
  const response = await api.get<ApiResponse<TypingExamListResponse>>(
    BASE_URL,
    { params: filters },
  );

  return response.data.data;
};

// ==========================================
// SINGLE EXAM DETAILS
// ==========================================

export const getPublishedExamById = async (
  examId: MongoId,
): Promise<TypingExamDetailResponse> => {
  const response = await api.get<ApiResponse<TypingExamDetailResponse>>(
    `${BASE_URL}/${examId}`,
  );

  return response.data.data;
};

// ==========================================
// EXAM PASSAGES
// ==========================================

export const getExamPassages = async (
  examId: MongoId,
  filters: TypingPassageFilters = {},
): Promise<TypingPassageListResponse> => {
  const response = await api.get<ApiResponse<TypingPassageListResponse>>(
    `${BASE_URL}/${examId}/passages`,
    {
      params: filters,
    },
  );

  return response.data.data;
};

// ==========================================
// START TYPING ATTEMPT
// ==========================================

export const startTypingAttempt = async (
  examId: MongoId,
  passageId: MongoId,
): Promise<StartTypingAttemptResponse> => {
  const response = await api.post<ApiResponse<StartTypingAttemptResponse>>(
    `${BASE_URL}/${examId}/passages/${passageId}/start`,
  );

  return response.data.data;
};

// ==========================================
// ATTEMPT HISTORY
// ==========================================

export const getTypingAttempts = async (
  filters: TypingAttemptFilters = {},
): Promise<TypingAttemptListResponse> => {
  const response = await api.get<ApiResponse<TypingAttemptListResponse>>(
    `${BASE_URL}/attempts/history`,
    {
      params: filters,
    },
  );

  return response.data.data;
};

// ==========================================
// UPDATE ATTEMPT PROGRESS
// ==========================================

export const updateTypingProgress = async (
  attemptId: MongoId,
  payload: UpdateTypingProgressPayload,
): Promise<UpdateTypingProgressResponse> => {
  const response = await api.patch<ApiResponse<UpdateTypingProgressResponse>>(
    `${BASE_URL}/attempts/${attemptId}/progress`,
    payload,
  );

  return response.data.data;
};

// ==========================================
// SUBMIT ATTEMPT
// ==========================================

export const submitTypingAttempt = async (
  attemptId: MongoId,
  payload: SubmitTypingAttemptPayload,
): Promise<SubmitTypingAttemptResponse> => {
  const response = await api.post<ApiResponse<SubmitTypingAttemptResponse>>(
    `${BASE_URL}/attempts/${attemptId}/submit`,
    payload,
  );

  return response.data.data;
};

// ==========================================
// ATTEMPT RESULT
// ==========================================

export const getTypingAttemptResult = async (
  attemptId: MongoId,
): Promise<TypingResultResponse> => {
  const response = await api.get<ApiResponse<TypingResultResponse>>(
    `${BASE_URL}/attempts/${attemptId}/result`,
  );

  return response.data.data;
};
