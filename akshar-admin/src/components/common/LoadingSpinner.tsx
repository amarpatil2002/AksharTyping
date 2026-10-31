interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({
  size = "md",
  message,
  fullScreen = false,
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-7 w-7 border-[3px]",
    lg: "h-10 w-10 border-4",
  };

  return (
    <div
      className={`flex items-center justify-center gap-3 ${
        fullScreen ? "min-h-screen" : "py-8"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-spin rounded-full border-blue-600 border-t-transparent ${sizes[size]}`}
      />

      {message && <span className="text-sm text-gray-600">{message}</span>}

      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingSpinner;
