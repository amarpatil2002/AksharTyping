import type { ReactNode } from "react";
import { AuthProvider } from "../../providers/AuthProvider";
import { TypingExamProvider } from "../../features/typing-exam/exam/context/TypingExamContext";
import { ToastProvider } from "../../components/common/ToastContext";
import { TypingPassageProvider } from "../../features/typing-exam/passage/context/TypingPassageProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <TypingExamProvider>
          <TypingPassageProvider>{children}</TypingPassageProvider>
        </TypingExamProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
