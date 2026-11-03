# Akshar AI — Typing Evaluation Engine

This bundle contains the evaluation-policy Mongoose model and the diagnostic/scoring engine modules.

## Folder layout

```text
akshar-ai-evaluation-engine/
├── models/
│   └── EvaluationPolicy.model.js
├── word/
│   ├── wordAlignment.js
│   └── wordMetrics.js
├── character/
│   ├── characterAlignment.js
│   └── characterMetrics.js
├── mistakeCalculator.js
├── mistakeClassifier.js
├── policyAdapter.js
├── qualificationCalculator.js
├── scoringCalculator.js
├── typingEvaluation.engine.js
└── index.js
```

## Runtime

- Node.js 22+
- `"type": "module"` in package.json
- Mongoose installed in the API project

## Import

Adjust relative paths if your current API has a different folder structure.

```js
import { evaluateTypingPerformance } from "./path/to/typingEvaluation.engine.js";

const result = evaluateTypingPerformance({
  originalText: "The quick brown fox jumps over the lazy dog.",
  typedText: "The quick brown fox jumps over the lazy dog.",
  examType: "WORD",
  durationSeconds: 60
});

console.log(result);
```

## With an evaluation policy

```js
import EvaluationPolicy from "./models/EvaluationPolicy.model.js";
import { evaluateTypingPerformance } from "./typingEvaluation.engine.js";

const policy = await EvaluationPolicy.findOne({
  code: "SAMPLE-WORD-EN",
  status: "ACTIVE"
}).lean();

const result = evaluateTypingPerformance({
  originalText,
  typedText,
  examType: "WORD",
  durationSeconds: 300,
  policy,
  wordConfig: {
    caseSensitive: false,
    punctuationSensitive: true
  }
});
```

The policy's `measurement.errorCalculation` chooses the authoritative alignment stream:
- `WORD_BASED`: word alignment is used for mistake classification.
- `CHARACTER_BASED`: grapheme alignment is used.
- `STROKE_BASED`: trusted keyboard-event metrics must be supplied separately.

For HYBRID exams, word and character diagnostics are both returned, but mistake counts are classified from only the policy-selected error basis. They are not added together, preventing double counting.

## Important limitations

1. This is a configurable evaluation foundation, not a claim that any default rule is an official SSC/RRB/CPCT/High Court/state rule. Only activate policies after checking the relevant recruitment notification/rulebook and validating against known examples.
2. `POLICY_DEFINED` methods deliberately throw until a custom evaluator is implemented. Do not silently substitute a generic formula.
3. Key depressions cannot be inferred from final typed text. Stroke-based policies require trusted keyboard-event capture and anti-tamper controls.
4. `Intl.Segmenter` grapheme clusters are a useful Unicode baseline, but each language/exam must be validated for its official counting convention.
5. The alignment algorithms use bounded dynamic-programming matrices. Large inputs intentionally fail at configured limits rather than exhausting memory. For long passages, use a tested scalable alignment strategy or chunking with boundary handling.
6. The generic mistake defaults are placeholders. Configure mistake classes and weights only from verified official rules.
7. A percentage penalty currently means a percentage of gross speed; use it only when that is exactly what the policy defines. It is not automatically a marks deduction.
8. Test against official sample passages and hand-calculated expected results before production deployment.

## Policy document example (configuration example only)

This is a schema-shaped example for local testing, not an official exam policy:

```js
{
  name: "Sample English Word Policy",
  code: "SAMPLE-WORD-EN",
  examCategory: "OTHER",
  language: "english",
  examType: "WORD",
  durationSeconds: 300,
  measurement: {
    grossSpeedMethod: "TOTAL_WORDS",
    netSpeedMethod: "CORRECT_WORDS",
    errorCalculation: "WORD_BASED"
  },
  scoring: {
    penaltyMethod: "NONE",
    penaltyValue: 0,
    fullMistakeWeight: 1,
    halfMistakeWeight: 0.5,
    scoringMethod: "NET_SPEED"
  },
  qualificationRules: {
    required: true,
    minimumSpeed: 30
  },
  status: "DRAFT"
}
```

## Before connecting to your API

- Confirm the actual `TypingExam` reference field points to `EvaluationPolicy`.
- Populate an immutable policy/config snapshot on each attempt so later admin edits do not change historical results.
- Make sure the service passes the exact `examType`, duration, config and policy snapshot to `evaluateTypingPerformance`.
- Do not save the returned alignment arrays in timeline documents; they can be large. Persist summary metrics and a separately controlled detailed report if required.
