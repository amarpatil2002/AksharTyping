import {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
    limit: 100,
    sort: "title_asc",
  });

  const examFiltersRef = useRef(examFilters);
  examFiltersRef.current = examFilters;

  const [examListLoading, setExamListLoading] = useState(false);
  const examRequestId = useRef(0);

  // ==========================================
  // EXAM DETAIL STATE
  // ==========================================

  const [selectedExam, setSelectedExam] =
    useState<TypingExamDetailResponse | null>(null);

  const [examDetailLoading, setExamDetailLoading] = useState(false);
  const examDetailRequestId = useRef(0);

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

  const passageFiltersRef = useRef(passageFilters);
  passageFiltersRef.current = passageFilters;

  const [passageListLoading, setPassageListLoading] = useState(false);
  const passageRequestId = useRef(0);

  // ==========================================
  // ERROR STATE
  // ==========================================

  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FETCH EXAMS
  // ==========================================

  const fetchExams = useCallback(async (filters?: TypingExamFilters) => {
    const appliedFilters = filters ?? examFiltersRef.current;
    const requestId = ++examRequestId.current;

    try {
      setExamListLoading(true);
      setError(null);

      const response = await getPublishedExams(appliedFilters);

      if (requestId === examRequestId.current) {
        setExams(response.exams);
        setExamPagination(response.pagination);

        examFiltersRef.current = appliedFilters;
        setExamFilters(appliedFilters);
      }

      return response;
    } catch (error) {
      if (requestId === examRequestId.current) {
        setError(getErrorMessage(error));
      }

      throw error;
    } finally {
      if (requestId === examRequestId.current) {
        setExamListLoading(false);
      }
    }
  }, []);

  // ==========================================
  // FETCH EXAM DETAILS
  // ==========================================

  const fetchExamById = useCallback(async (examId: MongoId) => {
    const requestId = ++examDetailRequestId.current;

    try {
      setExamDetailLoading(true);
      setError(null);

      const response = await getPublishedExamById(examId);

      if (requestId === examDetailRequestId.current) {
        setSelectedExam(response);
      }

      return response;
    } catch (error) {
      if (requestId === examDetailRequestId.current) {
        setError(getErrorMessage(error));
      }

      throw error;
    } finally {
      if (requestId === examDetailRequestId.current) {
        setExamDetailLoading(false);
      }
    }
  }, []);

  // ==========================================
  // FETCH PASSAGES
  // ==========================================

  const fetchPassages = useCallback(
    async (examId: MongoId, filters?: TypingPassageFilters) => {
      const appliedFilters = filters ?? passageFiltersRef.current;
      const requestId = ++passageRequestId.current;

      try {
        setPassageListLoading(true);
        setError(null);

        const response = await getExamPassages(examId, appliedFilters);

        if (requestId === passageRequestId.current) {
          setPassages(response.passages);
          setPassagePagination(response.pagination);

          passageFiltersRef.current = appliedFilters;
          setPassageFilters(appliedFilters);
        }

        return response;
      } catch (error) {
        if (requestId === passageRequestId.current) {
          setError(getErrorMessage(error));
        }

        throw error;
      } finally {
        if (requestId === passageRequestId.current) {
          setPassageListLoading(false);
        }
      }
    },
    [],
  );

  // ==========================================
  // UPDATE FILTERS
  // ==========================================

  const updateExamFilters = useCallback(
    (filters: Partial<TypingExamFilters>) => {
      setExamFilters((previous) => {
        const updated = {
          ...previous,
          ...filters,
          page: filters.page ?? 1,
        };

        examFiltersRef.current = updated;
        return updated;
      });
    },
    [],
  );

  const updatePassageFilters = useCallback(
    (filters: Partial<TypingPassageFilters>) => {
      setPassageFilters((previous) => {
        const updated = {
          ...previous,
          ...filters,
          page: filters.page ?? 1,
        };

        passageFiltersRef.current = updated;
        return updated;
      });
    },
    [],
  );

  // ==========================================
  // CLEAR ERROR
  // ==========================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==========================================
  // PROVIDER
  // ==========================================

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
