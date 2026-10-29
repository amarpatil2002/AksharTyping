import { apiClient } from "../../../services/apiClient";

const BASE_PATH = "/admin/typing-exam";

export type ExamStatus = "draft" | "published" | "active" | "archived";

export interface TypingExam {
  _id: string;
  name: string;
  title?: string;
  description?: string;
  status: ExamStatus;
  configId?: string;
  configurationId?: string;
  configuration?: {
    _id?: string;
    name?: string;
  };
  startAt?: string;
  endAt?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ExamPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExamListResponse {
  success: boolean;
  message?: string;
  data:
    | TypingExam[]
    | {
        items?: TypingExam[];
        exams?: TypingExam[];
        pagination?: ExamPagination;
      };
}

export interface ExamActionResponse {
  success: boolean;
  message?: string;
  data?: TypingExam;
}

export interface CreateExamPayload {
  title: string;
  passageText: string;
  configId: string;
}

export async function createExam(
  payload: CreateExamPayload,
): Promise<ExamActionResponse> {
  const response = await apiClient.post<ExamActionResponse>(BASE_PATH, payload);

  return response.data;
}

export async function getExams(
  params: ExamListParams = {},
): Promise<ExamListResponse> {
  const response = await apiClient.get<ExamListResponse>(BASE_PATH, {
    params,
  });

  return response.data;
}

export async function getExamById(examId: string): Promise<ExamActionResponse> {
  const response = await apiClient.get<ExamActionResponse>(
    `${BASE_PATH}/${examId}`,
  );

  return response.data;
}

export async function publishExam(examId: string): Promise<ExamActionResponse> {
  const response = await apiClient.post<ExamActionResponse>(
    `${BASE_PATH}/${examId}/publish`,
  );

  return response.data;
}

export async function archiveExam(examId: string): Promise<ExamActionResponse> {
  const response = await apiClient.post<ExamActionResponse>(
    `${BASE_PATH}/${examId}/archive`,
  );

  return response.data;
}

export async function deleteExam(examId: string): Promise<ExamActionResponse> {
  const response = await apiClient.delete<ExamActionResponse>(
    `${BASE_PATH}/${examId}/delete`,
  );

  return response.data;
}
