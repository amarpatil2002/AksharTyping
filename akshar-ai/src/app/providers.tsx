import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "../modules/auth/context/AuthContext";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
