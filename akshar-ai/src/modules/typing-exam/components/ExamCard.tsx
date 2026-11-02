import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Gauge, Globe2, Award } from "lucide-react";

import type { TypingExam } from "../types/typing.types";
import ExamImage from "./ExamImage";

interface ExamCardProps {
  exam: TypingExam;
}

const ExamCard = ({ exam }: ExamCardProps) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes && remainingSeconds) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    if (minutes) {
      return `${minutes} min`;
    }

    return `${remainingSeconds}s`;
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#E4E7EC] bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#B2CCFF] hover:shadow-md">
      {/* Exam Image */}
      <div className="h-24 overflow-hidden sm:h-28 lg:h-32">
        <ExamImage
          src={exam.imageUrl}
          title={exam.title}
          language={exam.language}
        />
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 text-[#101828] transition-colors group-hover:text-[#155EEF] sm:text-sm">
            {exam.title}
          </h3>

          <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 sm:text-[10px]">
            Published
          </span>
        </div>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-[#667085] sm:text-xs">
          {exam.description || "Improve your typing speed and accuracy."}
        </p>

        <div className="my-3 border-t border-[#EAECF0]" />

        {/* Exam Details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-[#F8FAFC] p-2">
            <div className="flex items-center gap-1 text-[10px] text-[#667085]">
              <Clock3 size={12} />
              Duration
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-[#101828] sm:text-[13px]">
              {formatDuration(exam.durationSeconds)}
            </p>
          </div>

          <div className="rounded-md bg-[#F8FAFC] p-2">
            <div className="flex items-center gap-1 text-[10px] text-[#667085]">
              <Gauge size={12} />
              Target Speed
            </div>
            <p className="mt-1 truncate text-xs font-semibold text-[#101828] sm:text-[13px]">
              {exam.targetWpm} WPM
            </p>
          </div>

          <div className="rounded-md bg-[#F8FAFC] p-2">
            <div className="flex items-center gap-1 text-[10px] text-[#667085]">
              <Globe2 size={12} />
              Language
            </div>
            <p className="mt-1 truncate text-xs font-semibold capitalize text-[#101828] sm:text-[13px]">
              {exam.language}
            </p>
          </div>

          <div className="rounded-md bg-[#F8FAFC] p-2">
            <div className="flex items-center gap-1 text-[10px] text-[#667085]">
              <Award size={12} />
              Scoring
            </div>
            <p className="mt-1 truncate text-xs font-semibold capitalize text-[#101828] sm:text-[13px]">
              {exam.scoring.method.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => navigate(`/typing-exams/${exam._id}`)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#155EEF] px-2 py-2 text-[11px] font-semibold text-white transition hover:bg-[#1049C7] sm:text-xs"
        >
          View Examination
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
};

export default ExamCard;
