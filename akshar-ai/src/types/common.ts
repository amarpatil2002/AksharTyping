import type { ReactNode } from "react";

export type ID = string;

export type Status = "idle" | "loading" | "success" | "error";

export type ComponentSize = "sm" | "md" | "lg";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
  disabled?: boolean;
}
