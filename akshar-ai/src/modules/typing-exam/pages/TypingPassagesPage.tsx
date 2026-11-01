import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PassageCard from "../components/PassageCard";
import useTyping from "../hooks/useTyping";
import { startTypingAttempt } from "../services/typing.service";

const TypingPassagesPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const {
    passages,
    passagePagination,
    passageListLoading,
    error,
    fetchPassages,
  } = useTyping();

  const [startingPassageId, setStartingPassageId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!examId) return;

    fetchPassages(examId, {
      page: 1,
      limit: 100,
    }).catch((error) => {
      console.error("Failed to fetch passages:", error);
    });
  }, [examId, fetchPassages]);

  const handleStart = async (passageId: string) => {
    if (!examId || startingPassageId) return;

    try {
      setStartingPassageId(passageId);

      const response = await startTypingAttempt(examId, passageId);

      navigate(`/typing-exam/${examId}/passages/${passageId}/start`, {
        state: {
          attempt: response.attempt,
          passage: response.passage,
          remainingSeconds: response.remainingSeconds,
        },
      });
    } catch (error) {
      console.error("Failed to start typing examination:", error);
    } finally {
      setStartingPassageId(null);
    }
  };

  if (!examId) {
    return <p className="p-8 text-red-600">Invalid examination ID.</p>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to={`/typing-exam/${examId}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Back to examination
      </Link>

      <div className="mb-8 mt-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Select Your Typing Passage
        </h1>

        <p className="mt-2 text-gray-600">
          Choose a passage to begin your typing examination.
        </p>
      </div>

      {passageListLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-52 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : passages.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold text-gray-900">No passages available</h2>
          <p className="mt-2 text-sm text-gray-500">
            Please check back later for available passages.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {passages.map((passage) => (
            <PassageCard
              key={passage._id}
              passage={passage}
              loading={startingPassageId === passage._id}
              onStart={handleStart}
            />
          ))}
        </div>
      )}

      {passagePagination && passagePagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            disabled={!passagePagination.hasPreviousPage || passageListLoading}
            onClick={() =>
              fetchPassages(examId, {
                page: passagePagination.page - 1,
                limit: 100,
              }).catch(console.error)
            }
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="py-2 text-sm text-gray-600">
            Page {passagePagination.page} of {passagePagination.totalPages}
          </span>

          <button
            type="button"
            disabled={!passagePagination.hasNextPage || passageListLoading}
            onClick={() =>
              fetchPassages(examId, {
                page: passagePagination.page + 1,
                limit: 100,
              }).catch(console.error)
            }
            className="rounded-lg border px-4 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TypingPassagesPage;
