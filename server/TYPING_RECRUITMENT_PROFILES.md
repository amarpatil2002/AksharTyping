# Recruitment typing profiles

These policies use the shared exam-evaluation service; court-specific calculators remain in `highCourtTyping.utility.js`. Create exam records and versioned policies through the admin endpoints; add approved practice passages before activating a profile. No official passage text is bundled.

## RSSB LDC / Junior Assistant 2026

Use one multilingual exam (`examCode: RSSB_LDC_JA_2026`) with separate Hindi and English passages. Each speed attempt uses a 600-second policy and evaluator `RSSB_LDC_JA_2026`. The separate calculator is `exam-utilities/rssbLdcJa2026.utility.js`:

- Correct Hindi word: 0.0625 marks; correct English word: 0.05 marks.
- Maximum: 25 marks; qualifying threshold: 9 marks per speed paper. Configure the published category relaxation by setting `evaluatorConfig.minimumMarks` for that candidate group, if the product models categories.
- The speed evaluator uses alignment's `words.correct` and retains word, character, substitution, insertion, and deletion diagnostics. It returns `resultScope: TYPING_SPEED_SECTION_ONLY`.
- `evaluateRssbEfficiencyTest` accepts an independently assessed mark (0–25) for Hindi MS Word 2013 / DevLys 010 or English MS Excel 2013. The typing passage endpoint does not infer Office task completion from typed text.
- `calculateRssbPhaseTwo` sums all four section results to `/100` and only qualifies when all four meet their `/9` minimum. `calculateRssbFinalMerit` combines Paper-I and Paper-II (each `/100`) with Phase-II for `/300`.
- The seeded policy's attempt endpoint evaluates speed sections. Efficiency marks and Paper-I / Paper-II results must come from their respective assessment workflows before calling the aggregate functions; a speed-section PASS alone is not an overall Phase-II pass.
- Use 400-word Hindi and 500-word English practice passages where feasible; the test interface may use excerpts or different content as instructed by RSSB.

Policy-specific settings belong in `evaluatorConfig`:

```json
{
  "minimumMarks": 9,
  "maximumMarks": 25
}
```

## MPSC Group C Clerk-Typist 2026

Use one multilingual exam (`examCode: MPSC_GROUP_C_CLERK_TYPIST_2026`) with Marathi and English practice passages and evaluator `MPSC_GROUP_C_CLERK_TYPIST_2026`.

This profile is explicitly **practice only**. The recruitment requirement is a qualifying typing certificate (Marathi 30 WPM or English 40 WPM); it is not an MPSC-run typing skill stage. The duration is a practice-session setting selected by the admin, not an official MPSC test duration. The result is persisted as `resultScope: PRACTICE_ONLY` so it cannot be mistaken for an official exam result.

An admin may override language thresholds through `evaluatorConfig.minimumWpm`; otherwise the evaluator applies 30 WPM for Marathi and 40 WPM for English. Do not interpret practice completion as certificate issuance or MPSC qualification.

## Lifecycle and policy safety

The seed leaves each exam DRAFT, so it is not listed to candidates. It creates an effective version and active evaluator policy for admin setup; add and review passages first, then activate the exam. Attempts snapshot their policy ID, so later policy updates do not change prior results. Publish future recruitment cycles as new versions and policies rather than changing historical scoring rules.
