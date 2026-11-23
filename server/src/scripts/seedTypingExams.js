import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import TypingExam from "../modules/akshar-typing-simple-v2/models/TypingExam.js";

const recruitmentProfiles = [
  {
    exam: {
      title: "RSSB LDC / Junior Assistant Typing 2026",
      slug: "rssb-ldc-junior-assistant-2026",
      examCode: "RSSB_LDC_JA_2026",
      authority: "Rajasthan Staff Selection Board",
      postName: "Clerk Grade-II / Junior Assistant",
      recruitmentCycle: "2026",
      examType: "HYBRID",
      language: "hindi",
      description:
        "RSSB LDC / Junior Assistant 2026 calculation profile: Hindi and English speed sections, separately assessed Word and Excel efficiency scores, Phase-II total, and final merit calculation.",
      active: true,
    },
    evaluator: "RSSB",
    durationSeconds: 600,
    evaluatorConfig: { maximumMarks: 25, minimumMarks: 9 },
  },
  {
    exam: {
      title: "MPSC Group C Clerk-Typist Certificate Practice 2026",
      slug: "mpsc-group-c-clerk-typist-practice-2026",
      examCode: "MPSC_GROUP_C_CLERK_TYPIST_2026",
      authority: "Maharashtra Public Service Commission",
      postName: "Clerk-Typist, Group C",
      recruitmentCycle: "2026",
      examType: "WORD",
      language: "marathi",
      description:
        "Typing-certificate practice only (Marathi 30 WPM or English 40 WPM). This is not an MPSC-run skill test or an official certificate.",
      active: true,
    },
    evaluator: "MPSC",
    // Practice-session length only; MPSC does not prescribe this as a skill test.
    durationSeconds: 600,
    evaluatorConfig: {},
  },
];

async function ensureProfile(profile) {
  const exam = await TypingExam.findOneAndUpdate(
    { examCode: profile.exam.examCode },
    {
      $setOnInsert: {
        ...profile.exam,
        policy: {
          durationSeconds: profile.durationSeconds,
          measurementUnit: "WPM",
          normalization: "NFC",
          penalty: { method: "NONE", value: 0 },
          qualification: { minimumSpeed: 0 },
          scoring: { method: "NONE", maximumMarks: 0, marksPerMistake: 0 },
          evaluator: profile.evaluator,
        },
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log(`${exam.examCode}: exam and evaluation policy ready`);
}

try {
  await connectDatabase();
  for (const profile of recruitmentProfiles) await ensureProfile(profile);
} catch (error) {
  console.error("Typing exam catalog seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
