import mongoose from "mongoose";

import TypingAttempt from "../models/TypingAttempt.model.js";
import TypingExam from "../models/TypingExam.model.js";
import TypingResult from "../models/TypingResult.model.js";

import { evaluateTypingPerformance } from "../engine/typingEvaluation.engine.js";

export async function evaluateTypingAttempt(attemptId) {
  if (!mongoose.isValidObjectId(attemptId)) {
    throw new Error("Invalid attempt ID");
  }

  // 1. Claim the attempt so two workers cannot evaluate it simultaneously.
  const attempt = await TypingAttempt.findOneAndUpdate(
    {
      _id: attemptId,
      status: "SUBMITTED",
    },
    {
      $set: {
        status: "EVALUATING",
        "evaluation.status": "PROCESSING",
        "evaluation.startedAt": new Date(),
      },
      $inc: {
        "evaluation.attempts": 1,
      },
    },
    {
      new: true,
    },
  );

  if (!attempt) {
    const existing = await TypingAttempt.findById(attemptId);

    if (!existing) {
      throw new Error("Typing attempt not found");
    }

    if (existing.status === "COMPLETED") {
      return TypingResult.findOne({
        attemptId: existing._id,
      });
    }

    throw new Error(
      `Attempt cannot be evaluated. Current status: ${existing.status}`,
    );
  }

  try {
    // 2. Load the exam and its configurations.
    const exam = attempt.examId
      ? await TypingExam.findById(attempt.examId)
          .populate("wordConfigId")
          .populate("characterConfigId")
          .populate("hybridConfigId")
          .populate("evaluationPolicyId")
      : null;

    if (attempt.examId && !exam) {
      throw new Error("Examination configuration not found");
    }

    // 3. Read the original passage and typed text.
    const originalText = attempt.originalText;
    const typedText = attempt.typedText;

    if (typeof originalText !== "string" || !originalText.length) {
      throw new Error("Original passage snapshot is missing");
    }

    if (typeof typedText !== "string") {
      throw new Error("Candidate typed text is missing");
    }

    // Use server-measured elapsed time, not the exam's allowed duration.
    const durationSeconds = attempt.timing?.elapsedSeconds;

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error("Invalid server-measured attempt duration");
    }

    const examType = attempt.examType;

    // 4. Get the applicable configuration.
    const wordConfig = exam?.wordConfigId?.toObject?.() ?? {};

    const characterConfig = exam?.characterConfigId?.toObject?.() ?? {};

    // 5. Run the universal diagnostic engine.
    const evaluation = evaluateTypingPerformance({
      originalText,
      typedText,
      examType,
      durationSeconds,
      wordConfig,
      characterConfig,
    });

    const word = evaluation.wordMetrics;
    const character = evaluation.characterMetrics;

    // 6. Save the result.
    const result = await TypingResult.create({
      userId: attempt.userId,
      attemptId: attempt._id,
      examId: attempt.examId ?? null,

      language: attempt.language,
      examType: attempt.examType,
      attemptType: attempt.attemptType,

      wordMetrics: word
        ? {
            totalWords: word.totalWords,
            wordsTyped: word.wordsTyped,
            correctWords: word.correctWords,
            incorrectWords: word.incorrectWords,
            grossWpm: word.grossWpm,
            netWpm: word.netWpm,
            accuracy: word.accuracy,
          }
        : null,

      characterMetrics: character
        ? {
            totalCharacters: character.totalCharacters,
            charactersTyped: character.charactersTyped,
            correctCharacters: character.correctCharacters,
            incorrectCharacters: character.incorrectCharacters,
            grossCpm: character.grossCpm,
            netCpm: character.netCpm,
            grossKdph: character.grossKdph,
            netKdph: character.netKdph,
            accuracy: character.accuracy,
          }
        : null,

      performance: {
        grossSpeed: word?.grossWpm ?? character?.grossCpm ?? null,
        netSpeed: word?.netWpm ?? character?.netCpm ?? null,
        measurementUnit: word ? "WPM" : character ? "CPM" : null,
        accuracy: word?.accuracy ?? character?.accuracy ?? null,
      },

      mistakes: {
        substitutions:
          evaluation.mistakes.word?.substitutions ??
          evaluation.mistakes.character?.substitutions ??
          0,

        omissions:
          evaluation.mistakes.word?.omissions ??
          evaluation.mistakes.character?.omissions ??
          0,

        insertions:
          evaluation.mistakes.word?.insertions ??
          evaluation.mistakes.character?.insertions ??
          0,

        transpositions:
          evaluation.mistakes.word?.transpositions ??
          evaluation.mistakes.character?.transpositions ??
          0,
      },

      timing: {
        durationSeconds: exam?.durationSeconds ?? durationSeconds,
        elapsedSeconds: durationSeconds,
      },

      scoring: {
        method: "CUSTOM",
        qualified: null,
        status: "PENDING",
      },

      evaluation: {
        evaluator: "UNIVERSAL_ENGINE",
        policyVersion: exam?.policyVersion ?? null,
        calculationVersion: "1.0.0",
        reportVersion: 1,
      },
    });

    // 7. Mark the attempt as completed.
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        status: "EVALUATING",
      },
      {
        $set: {
          status: "COMPLETED",
          resultId: result._id,
          "evaluation.status": "COMPLETED",
          "evaluation.completedAt": new Date(),
        },
      },
    );

    return result;
  } catch (error) {
    // 8. Record failure so it can be investigated or retried.
    await TypingAttempt.updateOne(
      {
        _id: attempt._id,
        status: "EVALUATING",
      },
      {
        $set: {
          status: "EVALUATION_FAILED",
          "evaluation.status": "FAILED",
          "evaluation.errorMessage": error.message,
          "evaluation.completedAt": new Date(),
        },
      },
    );

    throw error;
  }
}
