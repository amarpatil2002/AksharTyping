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
// SCORING TYPES
// ==========================================

export type TypingScoringMethod =
  | "standard"
  | "net_wpm"
  | "accuracy"
  | "weighted"
  | "custom";

export interface TypingScoring {
  method: TypingScoringMethod;
  wordLength: number;
  minimumWpm: number;
  minimumAccuracy: number;
  errorPenalty: number;
  speedWeight: number;
  accuracyWeight: number;
}

export interface TypingMarksConfiguration {
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
}

// ==========================================
// EXAM TYPES
// ==========================================

export type TypingExamSort = "newest" | "oldest" | "title_asc" | "title_desc";

export interface TypingExam {
  _id: MongoId;
  title: string;
  slug: string;
  description: string;
  language: string;
  durationSeconds: number;
  targetWpm: number;
  maximumMarks: number;
  passingPercentage: number;
  scoring: TypingScoring;
  instructions: string[];
  imageUrl?: string | null;
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
  marksConfiguration: TypingMarksConfiguration;
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
  content?: string;
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
  exam: Pick<
    TypingExam,
    "title" | "language" | "durationSeconds" | "targetWpm" | "scoring"
  > &
    Partial<Pick<TypingExam, "maximumMarks" | "passingPercentage">>;
  marksConfiguration: TypingMarksConfiguration;
  passages: TypingPassage[];
  pagination: PaginationMeta;
}

// ==========================================
// WORD-BASED TYPING METRICS
// ==========================================

/**
 * All evaluated typing counts are word-based.
 * Do not use character counts to calculate WPM, accuracy, or errors.
 */
export interface TypingWordMetrics {
  totalWords: number;
  wordsTyped: number;
  correctWords: number;
  incorrectWords: number;
  misspellings: number;
  omissions: number;
  notReachedWords: number;
  extraWords: number;
  totalErrors: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
}

export type TypingMetrics = TypingWordMetrics;

export interface TypingTimelineEntry extends TypingWordMetrics {
  elapsedSeconds: number;
  errorsInInterval: number;
}

export type TypingTimelinePoint = TypingTimelineEntry;

// ==========================================
// ATTEMPT TYPES
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
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
  scoring: TypingScoring;
}

export interface TypingAttemptPassage {
  title: string;
  language: string;
  content: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
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

export interface TypingAttemptHistoryExam {
  _id: MongoId;
  title: string;
  slug: string;
  language: string;
}

export interface TypingAttemptHistoryItem {
  _id: MongoId;
  examId: TypingAttemptHistoryExam | MongoId | null;
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
  exam: {
    title: string;
    language: string;
    durationSeconds: number;
    targetWpm: number;
    maximumMarks: number;
    passingPercentage: number;
    passingMarks: number;
    scoring: TypingScoring;
  };
  passage: TypingAttemptPassage;
  remainingSeconds: number;
  deletedExpiredAttempts: number;
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

export interface TypingAttemptResult extends TypingWordMetrics {
  marks: number;
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
  meetsMinimumWpm: boolean;
  meetsMinimumAccuracy: boolean;
  meetsPassingMarks: boolean;
  passed: boolean;
  evaluatedAt: string;
}

export interface SubmitTypingAttemptResponse {
  attemptId: MongoId;
  status: "evaluated";
  submittedAt: string;
  progressVersion: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  result: TypingAttemptResult;
}

// ==========================================
// RESULT SUMMARY / REQUIREMENTS
// ==========================================

export interface TypingResultSummary extends TypingAttemptResult {
  percentage: number;
}

export interface TypingResultRequirements {
  targetWpm: number;
  minimumWpm: number;
  minimumAccuracy: number;
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
  achievedWpm: number;
  achievedAccuracy: number;
  achievedMarks: number;
  wpmRequirementMet: boolean;
  accuracyRequirementMet: boolean;
  passingMarksRequirementMet: boolean;
  passed: boolean;
}

// ==========================================
// PERFORMANCE TIMELINE / MINUTE PERFORMANCE
// ==========================================

export type TypingSpeedTrend = "initial" | "increased" | "decreased" | "stable";

export interface TypingMinutePerformance {
  minute: number;
  label: string;
  durationSeconds: number;
  wordsTyped: number;
  correctWords: number;
  errors: number;
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  speedChange?: number;
  speedTrend?: TypingSpeedTrend;
}

// ==========================================
// CHART BREAKDOWN / COMPARISONS
// ==========================================

export interface TypingBreakdownItem {
  label: string;
  value: number;
}

export interface TypingSpeedComparison {
  grossWpm: number;
  netWpm: number;
  targetWpm: number;
  minimumWpm: number;
}

export interface TypingAccuracyComparison {
  achievedAccuracy: number;
  minimumAccuracy: number;
}

export interface TypingMarksComparison {
  achievedMarks: number;
  maximumMarks: number;
  passingMarks: number;
  passingPercentage: number;
  percentage: number;
}

export interface TypingWordErrorPercentages {
  incorrect: number;
  notReached: number;
  extra: number;
}

// ==========================================
// ADVANCED WORD-BASED ANALYTICS
// ==========================================

export interface TypingAnalyticsOverview {
  averageNetWpm: number;
  averageGrossWpm: number;
  peakNetWpm: number;
  lowestNetWpm: number;
  averageAccuracy: number;
  speedConsistency: number;
  speedDeviation: number;
  speedChange: number;
  accuracyChange: number;
  errorRate: number;
  correctWordRate: number;
  wordsPerMinute: number;
  estimatedWords: number;
  improvementPercentage: number;
  timelineSamples: number;
}

export interface TypingMinuteInsight {
  minute: number | null;
  elapsedMinute?: number | null;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
}

export interface TypingWordAnalytics {
  totalWords: number;
  wordsTyped: number;
  correctWords: number;
  incorrectWords: number;
  notReachedWords: number;
  extraWords: number;
  totalErrors: number;
  errorRate: number;
  correctWordRate: number;
}

export interface TypingHalfComparison {
  firstHalfAverageNetWpm: number;
  secondHalfAverageNetWpm: number;
  improvementPercentage: number;
}

export interface TypingAnalyticsInsight {
  type: "positive" | "improvement" | "info";
  title: string;
  description: string;
}

export interface TypingAdvancedAnalytics {
  overview: TypingAnalyticsOverview;
  bestMinute: TypingMinuteInsight | null;
  weakestMinute: TypingMinuteInsight | null;
  wordMetrics: TypingWordAnalytics;
  halfComparison: TypingHalfComparison;
  insights: TypingAnalyticsInsight[];
}

// ==========================================
// PERFORMANCE INSIGHTS
// ==========================================

export interface TypingPerformanceInsight {
  type: "positive" | "improvement" | "info";
  title: string;
  description: string;
}

// ==========================================
// RESULT RESPONSE
// ==========================================

export interface TypingResultExam {
  _id?: MongoId;
  title: string;
  slug?: string;
  language: string;
}

export interface TypingResultPassage {
  _id?: MongoId;
  title: string;
  language: string;
  wordCount: number;
  difficulty: TypingPassageDifficulty;
}

export interface TypingResultScoringConfiguration extends TypingScoring {
  targetWpm: number;
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
}

export interface TypingResultResponse {
  attempt: {
    attemptId: MongoId;
    status: "evaluated" | "expired" | string;
    startedAt: string;
    submittedAt: string;
    deadlineAt: string;
    elapsedSeconds: number;
    durationSeconds: number;
  };
  exam: TypingResultExam;
  passage: TypingResultPassage;
  scoringConfiguration: TypingResultScoringConfiguration;
  summary: TypingResultSummary;
  requirements: TypingResultRequirements;
  charts: {
    performanceTimeline: TypingTimelinePoint[];
    minutePerformance: TypingMinutePerformance[];
    wordBreakdown: TypingBreakdownItem[];
    wordErrorBreakdown: TypingBreakdownItem[];
    speedComparison: TypingSpeedComparison;
    accuracyComparison: TypingAccuracyComparison;
    marksComparison?: TypingMarksComparison;
    errorPercentages?: TypingWordErrorPercentages;
    halfComparison?: TypingHalfComparison;
  };
  analytics: TypingAdvancedAnalytics;
  performanceInsights: TypingPerformanceInsight[];
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

export interface TypingExamMarksConfiguration {
  maximumMarks: number;
  passingPercentage: number;
  passingMarks: number;
}
