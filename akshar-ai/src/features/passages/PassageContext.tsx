import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ADMIN_PASSAGES, type Passage } from "./passageData";

interface PassageContextValue {
  passages: Passage[];
  addPassage: (passage: Passage) => void;
}

const PassageContext = createContext<PassageContextValue | undefined>(
  undefined,
);

export function PassageProvider({ children }: { children: ReactNode }) {
  const [customPassages, setCustomPassages] = useState<Passage[]>([]);

  const addPassage = useCallback((passage: Passage) => {
    setCustomPassages((current) => [passage, ...current]);
  }, []);

  const passages = useMemo(
    () => [...customPassages, ...ADMIN_PASSAGES],
    [customPassages],
  );

  const value = useMemo(
    () => ({ passages, addPassage }),
    [passages, addPassage],
  );

  return (
    <PassageContext.Provider value={value}>{children}</PassageContext.Provider>
  );
}

export function usePassages() {
  const context = useContext(PassageContext);

  if (!context) {
    throw new Error("usePassages must be used inside PassageProvider");
  }

  return context;
}
