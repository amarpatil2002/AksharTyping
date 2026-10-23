import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  };
  return <button className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${styles[variant]} ${className}`} {...props}>{children}</button>;
}
