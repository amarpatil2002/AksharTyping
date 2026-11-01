export type MongoId = string;

// ==========================================
// COMMON TYPES
// ==========================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ==========================================
// EXAM TYPES
// ==========================================

export type TypingExamSort = "asc" | "desc";

export interface TypingScoring {
  method: "standard" | "net_wpm" | "accuracy" | "custom";
  wordLength: number;
  minimumWpm: number;
  minimumAccuracy: number;
  errorPenalty: number;
}

export interface TypingExam {
  _id: MongoId;
  title: string;
  slug: string;
  description: string;
  language: string;
  durationSeconds: number;
  targetWpm: number;
  scoring: TypingScoring;
  instructions: string[];
  createdAt: string;
}

export interface TypingExamFilters extends PaginationParams {
  search?: string;
  language?: string;
  sort?: TypingExamSort;
}

export interface TypingExamListResponse {
  exams: TypingExam[];
  pagination: PaginationMeta;
}

export interface TypingExamDetailResponse {
  exam: TypingExam;
  passageCount: number;
  isAvailable: boolean;
}

// ==========================================
// PASSAGE TYPES
// ==========================================

export type TypingPassageDifficulty = "easy" | "medium" | "hard";

export interface TypingPassage {
  _id: MongoId;
  title: string;
  content: string;
  language: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
  createdAt: string;
}

export interface TypingPassageFilters extends PaginationParams {
  search?: string;
  difficulty?: TypingPassageDifficulty;
}

export interface TypingPassageListResponse {
  passages: TypingPassage[];
  pagination: PaginationMeta;
}

// ==========================================
// TYPING ATTEMPT TYPES
// ==========================================

export type TypingAttemptStatus =
  | "in_progress"
  | "submitted"
  | "evaluated"
  | "expired"
  | "abandoned";

export interface TypingAttemptConfig {
  title: string;
  language: string;
  durationSeconds: number;
  targetWpm: number;
  scoring: TypingScoring;
}

export interface TypingAttemptPassage {
  title: string;
  language: string;
  content: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
}

export interface TypingMetrics {
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  missedCharacters: number;
  extraCharacters: number;
  totalErrors: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
}

export interface TypingTimelineEntry extends TypingMetrics {
  elapsedSeconds: number;
  typedCharacters: number;
  errorsInInterval: number;
}

export interface TypingAttempt {
  _id: MongoId;
  examId: MongoId;
  passageId: MongoId;
  configSnapshot: TypingAttemptConfig;
  passageSnapshot: string;
  typedText: string;
  status: TypingAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  progressVersion: number;
  timeline: TypingTimelineEntry[];
  result?: TypingAttemptResult;
  createdAt: string;
  updatedAt: string;
}

export interface TypingAttemptFilters extends PaginationParams {
  examId?: MongoId;
  status?: TypingAttemptStatus;
  sort?: "newest" | "oldest";
}

export interface TypingAttemptHistoryItem {
  _id: MongoId;
  examId: TypingExam | MongoId;
  passageId: MongoId;
  configSnapshot: {
    title: string;
  };
  status: TypingAttemptStatus;
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  result?: TypingAttemptResult;
  createdAt: string;
}

export interface TypingAttemptListResponse {
  attempts: TypingAttemptHistoryItem[];
  pagination: PaginationMeta;
}

// ==========================================
// START ATTEMPT
// ==========================================

export interface StartTypingAttemptResponse {
  attempt: TypingAttempt;
  passage: TypingAttemptPassage;
  remainingSeconds: number;
}

// ==========================================
// PROGRESS / AUTOSAVE
// ==========================================

export interface UpdateTypingProgressPayload {
  typedText: string;
  progressVersion: number;
}

export interface UpdateTypingProgressResponse {
  attemptId: MongoId;
  status: "in_progress";
  progressVersion: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  metrics: TypingMetrics;
  savedAt: string;
}

// ==========================================
// SUBMIT ATTEMPT
// ==========================================

export interface SubmitTypingAttemptPayload {
  typedText: string;
  progressVersion: number;
}

export interface TypingAttemptResult {
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  missedCharacters: number;
  extraCharacters: number;
  totalErrors: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  marks: number;
  maximumMarks: number;
  passed: boolean;
  evaluatedAt: string;
}

export interface SubmitTypingAttemptResponse {
  attemptId: MongoId;
  status: "evaluated";
  submittedAt: string;
  progressVersion: number;
  elapsedSeconds: number;
  result: TypingAttemptResult;
}

// ==========================================
// RESULT ANALYTICS
// ==========================================

export interface TypingResultSummary extends TypingAttemptResult {
  percentage: number;
}

export interface TypingResultRequirements {
  targetWpm: number;
  minimumWpm: number;
  minimumAccuracy: number;
  achievedWpm: number;
  achievedAccuracy: number;
  wpmRequirementMet: boolean;
  accuracyRequirementMet: boolean;
}

export interface TypingPerformanceTimelinePoint {
  elapsedSeconds: number;
  typedCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  missedCharacters: number;
  extraCharacters: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errorsInInterval: number;
}

export interface TypingMinutePerformance {
  minute: number;
  label: string;
  durationSeconds: number;
  charactersTyped: number;
  correctCharacters: number;
  errors: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  speedChange: number;
  speedTrend: "initial" | "increased" | "decreased" | "stable";
}

export interface TypingBreakdownItem {
  label: string;
  value: number;
}

export interface TypingPerformanceInsights {
  fastestMinute: TypingMinutePerformance | null;
  slowestMinute: TypingMinutePerformance | null;
  highestAccuracyMinute: TypingMinutePerformance | null;
  lowestAccuracyMinute: TypingMinutePerformance | null;
  mostErrorsMinute: TypingMinutePerformance | null;
  biggestImprovement: TypingMinutePerformance | null;
  biggestDecline: TypingMinutePerformance | null;
}

export interface TypingResultResponse {
  attempt: {
    attemptId: MongoId;
    status: "evaluated";
    startedAt: string;
    submittedAt: string;
    deadlineAt: string;
    elapsedSeconds: number;
    durationSeconds: number;
  };

  exam: {
    _id: MongoId;
    title: string;
    slug: string;
    language: string;
  };

  passage: {
    _id: MongoId;
    title: string;
    language: string;
    wordCount: number;
    difficulty: TypingPassageDifficulty;
  };

  scoringConfiguration: TypingScoring & {
    targetWpm: number;
  };

  summary: TypingResultSummary;

  requirements: TypingResultRequirements;

  charts: {
    performanceTimeline: TypingPerformanceTimelinePoint[];
    minutePerformance: TypingMinutePerformance[];
    characterBreakdown: TypingBreakdownItem[];
    errorBreakdown: TypingBreakdownItem[];
  };

  performanceInsights: TypingPerformanceInsights;

  result: TypingAttemptResult;
}

// ==========================================
// API RESPONSE WRAPPER
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
