import { AlertCircle, BookOpen } from "lucide-react";

import type { TypingExam } from "../types/typing.types";
import ExamCard from "./ExamCard";

interface ExamListProps {
  exams: TypingExam[];
  loading: boolean;
  error: string | null;
}

const ExamList = ({ exams, loading, error }: ExamListProps) => {
  // Loading State
  if (loading) {
    return (
      <div className="grid items-stretch grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-[#E4E7EC] bg-white shadow-sm"
          >
            {/* Image Skeleton */}
            <div className="h-24 animate-pulse bg-gradient-to-br from-[#EFF6FF] to-[#D6E4FF] sm:h-28 lg:h-32" />

            <div className="space-y-3 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />

              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />

              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />

              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-md bg-slate-100"
                  />
                ))}
              </div>

              <div className="h-8 animate-pulse rounded-md bg-blue-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-white px-4 py-8 text-center shadow-sm sm:py-10">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
          <AlertCircle size={21} className="text-red-500" />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-[#101828]">
          Unable to load examinations
        </h3>

        <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[#667085]">
          {error}
        </p>
      </div>
    );
  }

  // Empty State
  if (!exams.length) {
    return (
      <div className="rounded-lg border border-[#E4E7EC] bg-white px-4 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#EFF6FF]">
          <BookOpen size={22} className="text-[#155EEF]" />
        </div>

        <h3 className="mt-3 text-sm font-semibold text-[#101828]">
          No examinations available
        </h3>

        <p className="mt-1.5 text-xs text-[#667085]">
          Published typing examinations will appear here.
        </p>
      </div>
    );
  }

  // Examination Cards
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {exams.map((exam) => (
        <ExamCard key={exam._id} exam={exam} />
      ))}
    </div>
  );
};

export default ExamList;
