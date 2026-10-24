import { useEffect, useState } from "react";

export function useResendCountdown(initialSeconds = 60) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setTimeout(() => {
      setSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [seconds]);

  function start(duration = initialSeconds) {
    setSeconds(duration);
  }

  function reset() {
    setSeconds(0);
  }

  return {
    seconds,
    start,
    reset,
  };
}
