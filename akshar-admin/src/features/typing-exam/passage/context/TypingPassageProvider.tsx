import { createContext, useContext, useState, type ReactNode } from "react";

import * as passageService from "../services/passage.service";

import type {
  CreateTypingPassagePayload,
  UpdateTypingPassagePayload,
  TypingPassage,
  TypingPassageFilters,
  TypingPassageStatus,
} from "../types/passage.types";

import type { PaginationMeta } from "../../exam/types/typingExam.types";

interface TypingPassageContextType {
  passages: TypingPassage[];
  pagination: PaginationMeta | null;
  filters: TypingPassageFilters;
  examId: string | null;
  loading: boolean;
  error: string | null;

  setFilters: (filters: Partial<TypingPassageFilters>) => void;

  fetchPassages: (
    examId: string,
    filters?: TypingPassageFilters,
  ) => Promise<void>;

  refreshPassages: () => Promise<void>;

  getPassageById: (examId: string, passageId: string) => Promise<TypingPassage>;

  createPassage: (
    examId: string,
    payload: CreateTypingPassagePayload,
  ) => Promise<TypingPassage>;

  updatePassage: (
    examId: string,
    passageId: string,
    payload: UpdateTypingPassagePayload,
  ) => Promise<TypingPassage>;

  deletePassage: (examId: string, passageId: string) => Promise<void>;

  updatePassageStatus: (
    examId: string,
    passageId: string,
    status: TypingPassageStatus,
  ) => Promise<TypingPassage>;
}

export const TypingPassageContext = createContext<
  TypingPassageContextType | undefined
>(undefined);

export const TypingPassageProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [passages, setPassages] = useState<TypingPassage[]>([]);

  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [filters, setFiltersState] = useState<TypingPassageFilters>({
    page: 1,
    limit: 10,
  });

  const [examId, setExamId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update filters
  const setFilters = (newFilters: Partial<TypingPassageFilters>) => {
    setFiltersState((previous) => ({
      ...previous,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  };

  // Fetch passages for an exam
  const fetchPassages = async (
    selectedExamId: string,
    customFilters?: TypingPassageFilters,
  ) => {
    try {
      setLoading(true);
      setError(null);

      setExamId(selectedExamId);

      const activeFilters = customFilters ?? filters;

      const result = await passageService.getPassages(
        selectedExamId,
        activeFilters,
      );

      setPassages(result.passages);
      setPagination(result.pagination);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load passages.";

      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh current passage list
  const refreshPassages = async () => {
    if (!examId) return;

    await fetchPassages(examId);
  };

  // Create passage
  const createPassage = async (
    examId: string,
    payload: CreateTypingPassagePayload,
  ) => {
    const passage = await passageService.createPassage(examId, payload);

    await fetchPassages(examId);

    return passage;
  };

  // Get single passage
  const getPassageById = async (selectedExamId: string, passageId: string) => {
    return await passageService.getPassageById(selectedExamId, passageId);
  };

  // Update passage
  const updatePassage = async (
    selectedExamId: string,
    passageId: string,
    payload: UpdateTypingPassagePayload,
  ) => {
    const passage = await passageService.updatePassage(
      selectedExamId,
      passageId,
      payload,
    );

    await fetchPassages(selectedExamId);

    return passage;
  };

  // Delete passage
  const deletePassage = async (selectedExamId: string, passageId: string) => {
    await passageService.deletePassage(selectedExamId, passageId);

    await fetchPassages(selectedExamId);
  };

  // Update passage status
  const updatePassageStatus = async (
    selectedExamId: string,
    passageId: string,
    status: TypingPassageStatus,
  ) => {
    const passage = await passageService.updatePassageStatus(
      selectedExamId,
      passageId,
      status,
    );

    await fetchPassages(selectedExamId);

    return passage;
  };

  return (
    <TypingPassageContext.Provider
      value={{
        passages,
        pagination,
        filters,
        examId,
        loading,
        error,
        setFilters,
        fetchPassages,
        refreshPassages,
        getPassageById,
        createPassage,
        updatePassage,
        deletePassage,
        updatePassageStatus,
      }}
    >
      {children}
    </TypingPassageContext.Provider>
  );
};

export const useTypingPassageContext = () => {
  const context = useContext(TypingPassageContext);

  if (!context) {
    throw new Error(
      "useTypingPassageContext must be used inside TypingPassageProvider",
    );
  }

  return context;
};
