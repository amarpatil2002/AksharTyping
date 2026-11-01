export type ExamPreset = "tcs" | "ssc" | "ibps" | "custom";
export type LayoutMode = "horizontal" | "vertical";
export type FontSize = "small" | "medium" | "large";
export type ThemeMode = "light" | "dark";

export type FontFamily =
  | "arial"
  | "roboto"
  | "inter"
  | "calibri"
  | "times"
  | "mono";

export interface ExamSettings {
  examPreset: ExamPreset;
  layout: LayoutMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
  theme: ThemeMode;
  allowBackspace: boolean;
  allowPaste: boolean;
  showPassage: boolean;
  highlightErrors: boolean;
  showStatistics: boolean;
  autoFocus: boolean;
  autoScroll: boolean;
}

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  examPreset: "tcs",
  layout: "horizontal",
  fontSize: "medium",
  fontFamily: "arial",
  theme: "light",
  allowBackspace: true,
  allowPaste: false,
  showPassage: true,
  highlightErrors: true,
  showStatistics: true,
  autoFocus: true,
  autoScroll: true,
};

export const EXAM_PRESETS: Record<
  Exclude<ExamSettings["examPreset"], "custom">,
  Partial<ExamSettings>
> = {
  tcs: {
    layout: "horizontal",
    fontSize: "medium",
    fontFamily: "arial",
    theme: "light",
    allowBackspace: true,
    allowPaste: false,
    showPassage: true,
    highlightErrors: true,
    showStatistics: true,
    autoFocus: true,
    autoScroll: true,
  },

  ssc: {
    layout: "vertical",
    fontSize: "medium",
    fontFamily: "calibri",
    theme: "light",
    allowBackspace: true,
    allowPaste: false,
    showPassage: true,
    highlightErrors: false,
    showStatistics: true,
    autoFocus: true,
    autoScroll: true,
  },

  ibps: {
    layout: "horizontal",
    fontSize: "medium",
    fontFamily: "roboto",
    theme: "light",
    allowBackspace: true,
    allowPaste: false,
    showPassage: true,
    highlightErrors: true,
    showStatistics: true,
    autoFocus: true,
    autoScroll: true,
  },
};
