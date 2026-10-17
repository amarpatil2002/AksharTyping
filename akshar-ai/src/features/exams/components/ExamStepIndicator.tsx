import {
  ClipboardCheck,
  Keyboard,
  Coffee,
  FileText,
  Trophy,
  Check,
} from "lucide-react";

const steps = [
  { label: "Instructions", icon: ClipboardCheck },
  { label: "Keyboard test", icon: Keyboard },
  { label: "Break", icon: Coffee },
  { label: "Mock exam", icon: FileText },
  { label: "Results", icon: Trophy },
];

interface ExamStepIndicatorProps {
  currentStep: number;
}

export default function ExamStepIndicator({
  currentStep,
}: ExamStepIndicatorProps) {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white px-3 py-4 sm:px-6 shadow-sm">
      <div className="mx-auto flex max-w-5xl items-start">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const completed = index < currentStep;
          const active = index === currentStep;

          return (
            <div
              key={step.label}
              className="relative flex flex-1 flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-5 h-0.5 w-full ${
                    completed || active ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                  completed
                    ? "border-blue-600 bg-blue-600 text-white"
                    : active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {completed ? <Check size={18} /> : <StepIcon size={18} />}
              </div>

              <span
                className={`mt-2 text-center text-[10px] font-medium sm:text-xs ${
                  active
                    ? "text-blue-700"
                    : completed
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
