import { useState } from "react";
import { ArrowUpRight, Keyboard } from "lucide-react";

interface ExamImageProps {
  src?: string | null;
  title: string;
  language?: string;
}

const ExamImage = ({ src, title, language }: ExamImageProps) => {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;

  return (
    <div className="group/image relative h-24 w-full overflow-hidden bg-[#EFF6FF] sm:h-28 lg:h-32">
      {/* Fallback Image */}
      {showFallback ? (
        <div className="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#155EEF] via-[#2563EB] to-[#60A5FA]">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/20" />
          <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full border border-white/20" />

          <div className="relative flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/15 shadow-md backdrop-blur-md sm:h-14 sm:w-14">
              <Keyboard
                size={26}
                strokeWidth={1.5}
                className="text-white sm:h-7 sm:w-7"
              />
            </div>

            <p className="mt-2 text-[10px] font-bold tracking-[0.15em] text-white">
              AKSHAR AI
            </p>

            <p className="mt-0.5 text-[9px] text-blue-50">Typing Examination</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={`${title} examination`}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-105"
        />
      )}

      {/* Image Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

      {/* Image Label */}
      <div className="absolute left-2.5 top-2.5">
        <span className="rounded-full border border-white/40 bg-white/90 px-2 py-0.5 text-[8px] font-semibold tracking-wide text-[#155EEF] sm:text-[9px]">
          TYPING EXAM
        </span>
      </div>

      {/* Image Footer */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-medium capitalize text-blue-100 sm:text-[10px]">
            {language || "Typing Examination"}
          </p>

          <p className="mt-0.5 truncate text-xs font-semibold text-white sm:text-sm">
            {title}
          </p>
        </div>

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md sm:h-7 sm:w-7">
          <ArrowUpRight size={14} />
        </div>
      </div>
    </div>
  );
};

export default ExamImage;
