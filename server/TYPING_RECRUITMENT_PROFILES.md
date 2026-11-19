# Recruitment typing profiles

These evaluators plug into the existing versioned exam, passage, attempt, and evaluation-policy APIs. Create exam records and versioned policies through the admin endpoints; add approved practice passages before activating a profile. No official passage text is bundled.

## RSSB LDC / Junior Assistant 2026

Use one multilingual exam (`examCode: RSSB_LDC_JA_2026`) with separate Hindi and English passages. Each speed attempt uses a 600-second policy and evaluator `RSSB_LDC_JA_2026`:

- Correct Hindi word: 0.0625 marks; correct English word: 0.05 marks.
- Maximum: 25 marks; qualifying threshold: 9 marks per speed paper. Configure the published category relaxation by setting `evaluatorConfig.minimumMarks` for that candidate group, if the product models categories.
- The evaluator uses the common evaluator's `words.correct` count and returns `resultScope: TYPING_SPEED_SECTION_ONLY`.
- The recruitment has two additional efficiency papers (Hindi Word and English Excel). The current typing-attempt API cannot evaluate Office task completion, so an individual speed-section PASS is not an overall Phase II pass. Add a separate scored task evaluator before reporting full recruitment qualification.
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

Keep exam/version/passage records in DRAFT until passages and cycle rules have been reviewed. Activate each version with an effective date and attach an active evaluator policy. Attempts snapshot their policy ID, so later policy updates do not change prior results. Publish future recruitment cycles as new versions and policies rather than changing historical scoring rules.
