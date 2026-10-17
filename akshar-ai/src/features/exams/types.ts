export type ExamLanguage = "English" | "Marathi" | "Hindi";

export type ExamDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type ExamStatus = "draft" | "published";

export interface ExamPassage {
  id: string;
  title: string;
  text: string;
  language: ExamLanguage;
  difficulty: ExamDifficulty;
  category: string;
}

export interface ExamProfile {
  id: string;
  title: string;
  description: string;
  language: ExamLanguage;
  durationSeconds: number;
  targetWpm: number;
  passageIds: string[];
  status: ExamStatus;
  markingConfig: ExamMarkingConfig;
}

export type ScoringMethod = "manual" | "formula" | "qualifying";

export interface ExamMarkingConfig {
  scoringMethod: ScoringMethod;
  maxMarks: number;
  qualifyingMarks?: number;
  durationSeconds: number;
  minimumWpm?: number;
  minimumAccuracy?: number;
  passageWordCount?: number;
  formula?: {
    // Only define supported, documented formula options here.
    marksPerCorrectCharacter?: number;
    penaltyPerError?: number;
  };
}
