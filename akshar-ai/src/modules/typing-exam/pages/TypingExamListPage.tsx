import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe2,
  Keyboard,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";

import useTyping from "../hooks/useTyping";
import type { TypingExam } from "../types/typing.types";

const TypingExamListPage = () => {
  const { exams, examPagination, examListLoading, error, fetchExams } =
    useTyping();

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (initialFetchDone.current) return;

    initialFetchDone.current = true;
    fetchExams({ page: 1, limit: 100, sort: "title_asc" });
  }, [fetchExams]);

  const filteredExams = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return exams;

    return exams.filter((exam) =>
      [
        exam.title,
        exam.language,
        exam.description || "",
        exam.scoring.method.replace(/_/g, " "),
      ].some((value) => value.toLowerCase().includes(search)),
    );
  }, [exams, searchTerm]);

  const handlePageChange = (page: number) => {
    if (examListLoading) return;

    fetchExams({
      page,
      limit: 100,
      sort: "asc",
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Top accent */}

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-7 sm:px-6 sm:pt-10 lg:px-10">
        {/* Page heading */}
        <section className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#155EEF]">
            <Keyboard size={23} strokeWidth={1.8} />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#155EEF]">
            Akshar AI · Typing Practice
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#101828] sm:text-4xl lg:text-[42px]">
            All Examinations
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667085] sm:text-base">
            Practice for competitive examinations and improve your typing speed,
            accuracy, and confidence.
          </p>

          <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-[#155EEF]" />
        </section>

        {/* Search */}
        <section className="mx-auto mb-8 w-full max-w-2xl sm:mb-10">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search exams (e.g. SSC, NTPC, JSA...)"
              aria-label="Search examinations"
              className="h-14 w-full rounded-full border border-[#E4E7EC] bg-white pl-12 pr-12 text-sm text-[#101828] shadow-[0_4px_20px_rgba(16,24,40,0.06)] outline-none transition placeholder:text-[#98A2B3] hover:border-[#D0D5DD] focus:border-[#155EEF] focus:ring-4 focus:ring-blue-100 sm:text-base"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#667085] transition hover:bg-gray-100 hover:text-[#101828]"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {searchTerm.trim() && (
            <p className="mt-3 text-center text-xs text-[#667085]">
              {filteredExams.length} examination
              {filteredExams.length !== 1 ? "s" : ""} found
            </p>
          )}
        </section>

        {/* Exam cards */}
        <section id="available-examinations" className="scroll-mt-6">
          {!examListLoading && !error && filteredExams.length > 0 && (
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#101828]">
                  Available Examinations
                </h2>
                <p className="mt-1 text-xs text-[#667085]">
                  Select an examination to view its details and passages.
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#475467]">
                {filteredExams.length} exams
              </span>
            </div>
          )}

          {examListLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-sm"
                >
                  <div className="flex h-28 items-center justify-center">
                    <div className="h-20 w-20 animate-pulse rounded-full bg-[#F2F4F7]" />
                  </div>
                  <div className="mx-auto mt-3 h-5 w-3/4 animate-pulse rounded bg-[#F2F4F7]" />
                  <div className="mx-auto mt-3 h-10 w-36 animate-pulse rounded-full bg-[#F2F4F7]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-white px-5 py-10 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <button
                type="button"
                onClick={() =>
                  fetchExams({ page: 1, limit: 100, sort: "title_asc" })
                }
                className="mt-4 rounded-lg bg-[#155EEF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004EEB]"
              >
                Try again
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-[#E4E7EC] bg-white px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7] text-[#667085]">
                <Search size={23} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#101828]">
                No examinations found
              </h3>

              <p className="mt-1 text-sm text-[#667085]">
                Try another examination name or language.
              </p>

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-sm font-semibold text-[#155EEF] hover:text-[#004EEB]"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredExams.map((exam) => (
                <ExamDisplayCard
                  key={exam._id}
                  exam={exam}
                  onClick={() => navigate(`/typing-exams/${exam._id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!searchTerm.trim() &&
            examPagination &&
            examPagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#E4E7EC] pt-5 sm:flex-row">
                <p className="text-xs text-[#667085]">
                  Page {examPagination.page} of {examPagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(examPagination.page - 1)}
                    disabled={
                      !examPagination.hasPreviousPage || examListLoading
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-4 text-sm font-medium text-[#344054] transition hover:border-[#155EEF] hover:text-[#155EEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(examPagination.page + 1)}
                    disabled={!examPagination.hasNextPage || examListLoading}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-white px-4 text-sm font-medium text-[#344054] transition hover:border-[#155EEF] hover:text-[#155EEF] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#E4E7EC] pt-5 text-center">
          <p className="text-xs text-[#98A2B3]">
            © {new Date().getFullYear()} Akshar AI. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
};

interface ExamDisplayCardProps {
  exam: TypingExam;
  onClick: () => void;
}

const ExamDisplayCard = ({ exam, onClick }: ExamDisplayCardProps) => {
  const imageUrl = (exam as TypingExam & { imageUrl?: string | null }).imageUrl;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#B2CCFF] hover:shadow-[0_12px_28px_rgba(21,94,239,0.10)]">
      {/* Logo / image */}
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-b from-[#F8FAFF] to-white px-5 pt-5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${exam.title} logo`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-24 w-24 object-contain transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#155EEF] transition duration-300 group-hover:scale-105">
            <Award size={37} strokeWidth={1.5} />
          </div>
        )}

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">
          <ShieldCheck size={11} />
          Published
        </span>
      </div>

      {/* Exam details */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2 text-center sm:px-5">
        <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-[#101828] transition group-hover:text-[#155EEF] sm:text-[17px]">
          {exam.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px] text-[#667085]">
          <span className="inline-flex items-center gap-1">
            <Globe2 size={13} className="text-[#155EEF]" />
            <span className="capitalize">{exam.language}</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} className="text-[#155EEF]" />
            {Math.ceil(exam.durationSeconds / 60)} min
          </span>

          <span className="inline-flex items-center gap-1">
            <Target size={13} className="text-[#155EEF]" />
            {exam.targetWpm} WPM
          </span>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#155EEF] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004EEB] focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <Keyboard size={17} />
          Practice Now
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </article>
  );
};

export default TypingExamListPage;
