import { createContext, useContext, useState, type ReactNode } from "react";

import { SAMPLE_EXAM_PASSAGES, SAMPLE_EXAM_PROFILES } from "./examData";

import type { ExamPassage, ExamProfile } from "./types";

interface ExamContextValue {
  passages: ExamPassage[];
  exams: ExamProfile[];
  addPassage: (passage: ExamPassage) => void;
  updatePassage: (passage: ExamPassage) => void;
  deletePassage: (id: string) => void;
  addExam: (exam: ExamProfile) => void;
  updateExam: (exam: ExamProfile) => void;
  deleteExam: (id: string) => void;
}

const ExamContext = createContext<ExamContextValue | undefined>(undefined);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [passages, setPassages] = useState<ExamPassage[]>(SAMPLE_EXAM_PASSAGES);

  const [exams, setExams] = useState<ExamProfile[]>(SAMPLE_EXAM_PROFILES);

  const addPassage = (passage: ExamPassage) => {
    setPassages((current) => [...current, passage]);
  };

  const updatePassage = (passage: ExamPassage) => {
    setPassages((current) =>
      current.map((item) => (item.id === passage.id ? passage : item)),
    );
  };

  const deletePassage = (id: string) => {
    setPassages((current) => current.filter((item) => item.id !== id));

    setExams((current) =>
      current.map((exam) => ({
        ...exam,
        passageIds: exam.passageIds.filter((passageId) => passageId !== id),
      })),
    );
  };

  const addExam = (exam: ExamProfile) => {
    setExams((current) => [...current, exam]);
  };

  const updateExam = (exam: ExamProfile) => {
    setExams((current) =>
      current.map((item) => (item.id === exam.id ? exam : item)),
    );
  };

  const deleteExam = (id: string) => {
    setExams((current) => current.filter((item) => item.id !== id));
  };

  return (
    <ExamContext.Provider
      value={{
        passages,
        exams,
        addPassage,
        updatePassage,
        deletePassage,
        addExam,
        updateExam,
        deleteExam,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExams() {
  const context = useContext(ExamContext);

  if (!context) {
    throw new Error("useExams must be used inside ExamProvider");
  }

  return context;
}
