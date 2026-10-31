import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import * as examService from "../services/typingExam.service";

import type {
  CreateTypingExamPayload,
  UpdateTypingExamPayload,
  TypingExam,
  TypingExamFilters,
  PaginationMeta,
} from "../types/typingExam.types";

interface TypingExamContextType {
  exams: TypingExam[];
  pagination: PaginationMeta | null;
  filters: TypingExamFilters;
  loading: boolean;
  error: string | null;

  setFilters: (filters: Partial<TypingExamFilters>) => void;
  fetchExams: () => Promise<void>;
  refreshExams: () => Promise<void>;

  getExamById: (id: string) => Promise<TypingExam>;
  createExam: (data: CreateTypingExamPayload) => Promise<TypingExam>;
  updateExam: (
    id: string,
    data: UpdateTypingExamPayload,
  ) => Promise<TypingExam>;
  deleteExam: (id: string) => Promise<void>;
  updateExamStatus: (
    id: string,
    status: TypingExam["status"],
  ) => Promise<TypingExam>;
}

export const TypingExamContext = createContext<
  TypingExamContextType | undefined
>(undefined);

export const TypingExamProvider = ({ children }: { children: ReactNode }) => {
  const [exams, setExams] = useState<TypingExam[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [filters, setFiltersState] = useState<TypingExamFilters>({
    page: 1,
    limit: 10,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setFilters = (newFilters: Partial<TypingExamFilters>) => {
    setFiltersState((previous) => ({
      ...previous,
      ...newFilters,
    }));
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await examService.getExams(filters);

      setExams(result.exams);
      setPagination(result.pagination);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load exams.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchExams();
  }, [filters]);

  const refreshExams = async () => {
    await fetchExams();
  };

  const getExamById = async (id: string) => {
    return await examService.getExamById(id);
  };

  const createExam = async (data: CreateTypingExamPayload) => {
    const exam = await examService.createExam(data);
    await refreshExams();
    return exam;
  };

  const updateExam = async (id: string, data: UpdateTypingExamPayload) => {
    const exam = await examService.updateExam(id, data);
    await refreshExams();
    return exam;
  };

  const deleteExam = async (id: string) => {
    await examService.deleteExam(id);
    await refreshExams();
  };

  const updateExamStatus = async (id: string, status: TypingExam["status"]) => {
    const exam = await examService.updateExamStatus(id, status);
    await refreshExams();
    return exam;
  };

  return (
    <TypingExamContext.Provider
      value={{
        exams,
        pagination,
        filters,
        loading,
        error,
        setFilters,
        fetchExams,
        refreshExams,
        getExamById,
        createExam,
        updateExam,
        deleteExam,
        updateExamStatus,
      }}
    >
      {children}
    </TypingExamContext.Provider>
  );
};

export const useTypingExam = () => {
  const context = useContext(TypingExamContext);

  if (!context) {
    throw new Error("useTypingExam must be used inside TypingExamProvider");
  }

  return context;
};
