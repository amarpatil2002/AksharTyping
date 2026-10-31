import { createContext, useCallback, useState, type ReactNode } from "react";

import {
  getPublishedExams,
  getPublishedExamById,
  getExamPassages,
} from "../services/typing.service";

import type {
  MongoId,
  TypingExam,
  TypingExamFilters,
  TypingExamListResponse,
  TypingExamDetailResponse,
  TypingPassage,
  TypingPassageFilters,
  PaginationMeta,
} from "../types/typing.types";

// ==========================================
// CONTEXT TYPES
// ==========================================

interface TypingContextType {
  exams: TypingExam[];
  examPagination: PaginationMeta | null;
  examFilters: TypingExamFilters;
  examListLoading: boolean;

  selectedExam: TypingExamDetailResponse | null;
  examDetailLoading: boolean;

  passages: TypingPassage[];
  passagePagination: PaginationMeta | null;
  passageFilters: TypingPassageFilters;
  passageListLoading: boolean;

  error: string | null;

  fetchExams: (filters?: TypingExamFilters) => Promise<TypingExamListResponse>;

  fetchExamById: (examId: MongoId) => Promise<TypingExamDetailResponse>;

  fetchPassages: (
    examId: MongoId,
    filters?: TypingPassageFilters,
  ) => Promise<{
    passages: TypingPassage[];
    pagination: PaginationMeta;
  }>;

  updateExamFilters: (filters: Partial<TypingExamFilters>) => void;

  updatePassageFilters: (filters: Partial<TypingPassageFilters>) => void;

  clearError: () => void;
}

export const TypingContext = createContext<TypingContextType | undefined>(
  undefined,
);

// ==========================================
// ERROR HANDLER
// ==========================================

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

// ==========================================
// PROVIDER
// ==========================================

interface TypingProviderProps {
  children: ReactNode;
}

export const TypingProvider = ({ children }: TypingProviderProps) => {
  // ==========================================
  // EXAM STATE
  // ==========================================

  const [exams, setExams] = useState<TypingExam[]>([]);

  const [examPagination, setExamPagination] = useState<PaginationMeta | null>(
    null,
  );

  const [examFilters, setExamFilters] = useState<TypingExamFilters>({
    page: 1,
    limit: 20,
    sort: "newest",
  });

  const [examListLoading, setExamListLoading] = useState(false);

  // ==========================================
  // EXAM DETAIL STATE
  // ==========================================

  const [selectedExam, setSelectedExam] =
    useState<TypingExamDetailResponse | null>(null);

  const [examDetailLoading, setExamDetailLoading] = useState(false);

  // ==========================================
  // PASSAGE STATE
  // ==========================================

  const [passages, setPassages] = useState<TypingPassage[]>([]);

  const [passagePagination, setPassagePagination] =
    useState<PaginationMeta | null>(null);

  const [passageFilters, setPassageFilters] = useState<TypingPassageFilters>({
    page: 1,
    limit: 20,
  });

  const [passageListLoading, setPassageListLoading] = useState(false);

  // ==========================================
  // ERROR STATE
  // ==========================================

  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FETCH EXAMS
  // ==========================================

  const fetchExams = useCallback(
    async (filters: TypingExamFilters = examFilters) => {
      try {
        setExamListLoading(true);
        setError(null);

        const response = await getPublishedExams(filters);

        setExams(response.exams);
        setExamPagination(response.pagination);
        setExamFilters(filters);

        return response;
      } catch (error) {
        setError(getErrorMessage(error));
        throw error;
      } finally {
        setExamListLoading(false);
      }
    },
    [examFilters],
  );

  // ==========================================
  // FETCH EXAM DETAILS
  // ==========================================

  const fetchExamById = useCallback(async (examId: MongoId) => {
    try {
      setExamDetailLoading(true);
      setError(null);

      const response = await getPublishedExamById(examId);

      setSelectedExam(response);

      return response;
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setExamDetailLoading(false);
    }
  }, []);

  // ==========================================
  // FETCH PASSAGES
  // ==========================================

  const fetchPassages = useCallback(
    async (examId: MongoId, filters: TypingPassageFilters = passageFilters) => {
      try {
        setPassageListLoading(true);
        setError(null);

        const response = await getExamPassages(examId, filters);

        setPassages(response.passages);
        setPassagePagination(response.pagination);
        setPassageFilters(filters);

        return response;
      } catch (error) {
        setError(getErrorMessage(error));
        throw error;
      } finally {
        setPassageListLoading(false);
      }
    },
    [passageFilters],
  );

  // ==========================================
  // UPDATE FILTERS
  // ==========================================

  const updateExamFilters = useCallback(
    (filters: Partial<TypingExamFilters>) => {
      setExamFilters((previous) => ({
        ...previous,
        ...filters,
        page: filters.page ?? 1,
      }));
    },
    [],
  );

  const updatePassageFilters = useCallback(
    (filters: Partial<TypingPassageFilters>) => {
      setPassageFilters((previous) => ({
        ...previous,
        ...filters,
        page: filters.page ?? 1,
      }));
    },
    [],
  );

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <TypingContext.Provider
      value={{
        exams,
        examPagination,
        examFilters,
        examListLoading,

        selectedExam,
        examDetailLoading,

        passages,
        passagePagination,
        passageFilters,
        passageListLoading,

        error,

        fetchExams,
        fetchExamById,
        fetchPassages,

        updateExamFilters,
        updatePassageFilters,

        clearError,
      }}
    >
      {children}
    </TypingContext.Provider>
  );
};
