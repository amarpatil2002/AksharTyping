import type { ReactNode } from "react";
import { AuthProvider } from "../../providers/AuthProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
