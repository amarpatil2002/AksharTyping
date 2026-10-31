import { useContext } from "react";
import { TypingContext } from "../context/TypingContext";

const useTyping = () => {
  const context = useContext(TypingContext);

  if (!context) {
    throw new Error("useTyping must be used within a TypingProvider.");
  }

  return context;
};

export default useTyping;
