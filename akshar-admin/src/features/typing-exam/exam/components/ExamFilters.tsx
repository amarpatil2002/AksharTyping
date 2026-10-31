import SearchInput from "../../../../components/common/SearchInput";
import { useTypingExam } from "../hooks/useTypingExam";
import type { TypingExamStatus } from "../types/typingExam.types";

const ExamFilters = () => {
  const { filters, setFilters } = useTypingExam();

  const handleStatusChange = (status: string) => {
    setFilters({
      status: status ? (status as TypingExamStatus) : undefined,
      page: 1,
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={filters.search ?? ""}
        onChange={(search) => setFilters({ search, page: 1 })}
        placeholder="Search exams by title or slug..."
      />

      <select
        value={filters.status ?? ""}
        onChange={(event) => handleStatusChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </select>

      <select
        value={filters.limit ?? 10}
        onChange={(event) =>
          setFilters({
            limit: Number(event.target.value),
            page: 1,
          })
        }
        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
      >
        <option value={10}>10 per page</option>
        <option value={25}>25 per page</option>
        <option value={50}>50 per page</option>
      </select>
    </div>
  );
};

export default ExamFilters;
