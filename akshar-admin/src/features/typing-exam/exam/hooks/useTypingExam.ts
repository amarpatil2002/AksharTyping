import { useContext } from "react";
import { TypingExamContext } from "../context/TypingExamContext";

export const useTypingExam = () => {
  const context = useContext(TypingExamContext);

  if (!context) {
    throw new Error("useTypingExam must be used within TypingExamProvider");
  }

  return context;
};
