import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "../modules/auth/context/AuthContext";
import { TypingProvider } from "../modules/typing-exam/context/TypingContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <TypingProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TypingProvider>
    </AuthProvider>
  );
}
