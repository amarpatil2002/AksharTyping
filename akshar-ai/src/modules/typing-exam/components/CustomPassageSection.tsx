import { useState } from "react";
import { FileText, Keyboard, LockKeyhole, Sparkles } from "lucide-react";

interface CustomPassageSectionProps {
  onStartPractice?: (passage: string) => void;
  maxWords?: number;
}

const CustomPassageSection = ({
  onStartPractice,
  maxWords = 300,
}: CustomPassageSectionProps) => {
  const [passage, setPassage] = useState("");

  const words = passage.trim() ? passage.trim().split(/\s+/).length : 0;

  const isValid = words > 0 && words <= maxWords;

  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#155EEF]">
          Personal Practice
        </p>

        <h2 className="mt-1 text-xl font-bold text-[#101828]">
          Custom Typing Practice
        </h2>

        <p className="mt-1 text-sm text-[#667085]">
          Practise typing using your own text or study material.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-[#EAECF0] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <Keyboard size={22} className="text-[#155EEF]" />
            </div>

            <div>
              <h3 className="font-bold text-[#101828]">
                Practice with your own passage
              </h3>
              <p className="mt-1 text-xs text-[#667085]">
                Paste text and start a typing session.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Free plan
          </span>
        </div>

        <div className="p-5">
          <label
            htmlFor="custom-passage"
            className="mb-2 block text-sm font-semibold text-[#344054]"
          >
            Your passage
          </label>

          <textarea
            id="custom-passage"
            value={passage}
            onChange={(event) => setPassage(event.target.value)}
            placeholder="Paste or type your own passage here..."
            rows={6}
            className="w-full resize-y rounded-xl border border-[#D0D5DD] bg-white p-4 text-sm leading-6 text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#155EEF] focus:ring-4 focus:ring-[#155EEF]/10"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#667085]">
              {words} / {maxWords} words
            </p>

            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#EAECF0]">
              <div
                className="h-full rounded-full bg-[#155EEF] transition-all"
                style={{
                  width: `${Math.min((words / maxWords) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {words > maxWords && (
            <p className="mt-2 text-xs font-medium text-red-600">
              Your passage exceeds the free plan limit of {maxWords} words.
            </p>
          )}

          <div className="mt-5 flex flex-col justify-between gap-4 border-t border-[#EAECF0] pt-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2 text-xs text-[#667085]">
              <FileText size={16} className="mt-0.5 shrink-0 text-[#155EEF]" />
              <span>
                Free practice is limited to {maxWords} words per passage.
              </span>
            </div>

            <button
              type="button"
              disabled={!isValid || !onStartPractice}
              onClick={() => onStartPractice?.(passage.trim())}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#155EEF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1049C7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Keyboard size={16} />
              Start Practice
            </button>
          </div>
        </div>
      </div>

      {/* Future premium feature preview */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-[#EFF6FF] p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
          <Sparkles size={19} className="text-[#155EEF]" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-[#101828]">
              More practice tools coming soon
            </h4>

            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#155EEF]">
              FUTURE
            </span>
          </div>

          <p className="mt-1 text-xs leading-5 text-[#667085]">
            Advanced passage management and additional practice features may be
            introduced in a future plan.
          </p>
        </div>

        <LockKeyhole size={17} className="shrink-0 text-[#155EEF]" />
      </div>
    </section>
  );
};

export default CustomPassageSection;
