export type ExamLanguage = "en" | "hi" | "mr";

export type ConfigStatus = "draft" | "active" | "archived";

export type PassageSourceType = "fixed" | "random" | "admin_selected";

export type EvaluationStrategy =
  | "gross_net_wpm"
  | "correct_words"
  | "error_penalty"
  | "qualification_only"
  | "custom";

export type WpmMethod = "gross" | "net";

export type AccuracyMethod = "allCharacters" | "typedCharacters";

export type PassingMode = "all" | "any";

export type ExamInputMode = "normal" | "restricted" | "exam";

export interface ExamMetadata {
  country: string;
  state: string;
  jurisdiction: string;
  recruitmentAuthority: string;
  courtName: string;
  postName: string;
  examCategory: string;
  examStage: string;
  notificationNumber: string;
  notificationDate?: string | null;
  officialSourceUrl: string;
  officialRulesVerified: boolean;
  ruleVersion: string;
  notes: string;
}

export interface PassageSettings {
  sourceType: PassageSourceType;
  expectedWordCount?: number | null;
  expectedLineCount?: number | null;
  minimumWordCount?: number | null;
  maximumWordCount?: number | null;
  preserveLineBreaks: boolean;
  allowParagraphs: boolean;
  allowNumbers: boolean;
  allowPunctuation: boolean;
}

export interface EvaluationRules {
  strategy: EvaluationStrategy;
  wordLength: number;
  wpmMethod: WpmMethod;
  accuracyMethod: AccuracyMethod;
  minimumWpm: number;
  minimumAccuracy: number;
  maximumErrors?: number | null;
  maximumErrorPercentage?: number | null;
  passingMode: PassingMode;
  countPunctuation: boolean;
  ignoreRepeatedSpaces: boolean;
  ignoreCase: boolean;
  errorPenaltyPerError: number;
  maximumMarks?: number | null;
  passingMarks?: number | null;
  qualificationOnly: boolean;
  minimumCorrectWords?: number | null;
  minimumCorrectCharacters?: number | null;
  allowIncompletePassage: boolean;
}

export interface ExamInterface {
  allowBackspace: boolean;
  allowDelete: boolean;
  allowArrowKeys: boolean;
  allowNavigationKeys: boolean;
  allowHomeEnd: boolean;
  allowPaste: boolean;
  allowCopy: boolean;
  allowCut: boolean;
  allowContextMenu: boolean;
  allowUndo: boolean;
  showReferencePassage: boolean;
  autoSubmitOnTimeout: boolean;
  showTimer: boolean;
  showLiveWpm: boolean;
  showLiveAccuracy: boolean;
  showErrorCount: boolean;
  enableSpellcheck: boolean;
  requireFullscreen: boolean;
  preventTextSelection: boolean;
  inputMode: ExamInputMode;
}

export type ExamWorkflowStageType = string;

export interface ExamWorkflowStage {
  key?: string;
  type: ExamWorkflowStageType;
  enabled?: boolean;
  required: boolean;
  durationSeconds?: number;
  settings?: Record<string, unknown>;
}

export interface ExamWorkflow {
  stages: ExamWorkflowStage[];
}

export interface AnalyticsSettings {
  recordIntervalSeconds: number;
  showSpeedTimeline: boolean;
  showAccuracyTimeline: boolean;
  showErrorAnalysis: boolean;
  showImprovementPlan: boolean;
  storeKeystrokeTimeline: boolean;
}

export interface TypingExamConfig {
  _id: string;
  name: string;
  description: string;
  language: ExamLanguage;
  durationSeconds: number;
  targetWpm: number;

  examMetadata: ExamMetadata;
  passageSettings: PassageSettings;
  instructions: string[];
  evaluationRules: EvaluationRules;
  examInterface: ExamInterface;
  examWorkflow: ExamWorkflow;
  analyticsSettings: AnalyticsSettings;

  version: number;
  status: ConfigStatus;
  createdBy?: string;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating a configuration.
 * Server-managed fields such as _id, version, status,
 * createdBy, updatedBy, and timestamps are excluded.
 */
export interface CreateTypingExamConfigPayload {
  name: string;
  description?: string;
  language: ExamLanguage;
  durationSeconds: number;
  targetWpm?: number;

  examMetadata?: ExamMetadata;
  passageSettings?: PassageSettings;
  instructions?: string[];
  evaluationRules?: Partial<EvaluationRules>;
  examInterface?: Partial<ExamInterface>;
  examWorkflow?: ExamWorkflow;
  analyticsSettings?: Partial<AnalyticsSettings>;
}

export type UpdateTypingExamConfigPayload = Partial<
  Omit<CreateTypingExamConfigPayload, "name">
> & {
  name?: string;
};

export interface ConfigListParams {
  page?: number;
  limit?: number;
  search?: string;
  language?: ExamLanguage;
  status?: ConfigStatus;
}

export interface ConfigPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConfigListResponse {
  success: boolean;
  message?: string;
  data: {
    items: TypingExamConfig[];
    pagination: ConfigPagination;
  };
}

export interface ConfigDetailResponse {
  success: boolean;
  message?: string;
  data: TypingExamConfig;
}

export interface ConfigMutationResponse {
  success: boolean;
  message: string;
  data: TypingExamConfig;
}

export interface TypingExamConfigForm extends Omit<
  CreateTypingExamConfigPayload,
  | "examMetadata"
  | "passageSettings"
  | "evaluationRules"
  | "examInterface"
  | "examWorkflow"
  | "analyticsSettings"
> {
  examMetadata: ExamMetadata;
  passageSettings: PassageSettings;
  evaluationRules: EvaluationRules;
  examInterface: ExamInterface;
  examWorkflow: ExamWorkflow;
  analyticsSettings: AnalyticsSettings;
}
