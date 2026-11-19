# Typing exam API flow

Base URL for local development:

```text
http://localhost:5000/api/v1
```

Replace the example IDs and credentials with values returned by your API. Admin endpoints use a server-side session cookie. Candidate endpoints use a Bearer access token.

## 1. Sign in as an admin

An admin account must already exist and have the `admin` role. Save the session cookie and send it on every admin request:

```bash
curl -i -c admin.cookies -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"YOUR_ADMIN_PASSWORD"}' \
  http://localhost:5000/api/v1/admin/auth/login
```

## 2. Create an exam

```bash
curl -b admin.cookies -H "Content-Type: application/json" \
  -d '{
    "title":"High Court Typing Test",
    "slug":"high-court-typing-test",
    "description":"English typing examination",
    "authority":"Example High Court",
    "examCode":"HC-TYPE-01",
    "postName":"Typist",
    "recruitmentCycle":"2026",
    "examType":"WORD",
    "language":"english",
    "status":"ACTIVE"
  }' \
  http://localhost:5000/api/v1/admin/typing/exams
```

Copy `data._id` from the response as `EXAM_ID`.

## 3. Create an active exam version

Use an ISO date. The version must be active and within its effective date range for candidates to start attempts.

```bash
curl -b admin.cookies -H "Content-Type: application/json" \
  -d '{
    "examId":"EXAM_ID",
    "version":"2026-v1",
    "recruitmentCycle":"2026",
    "effectiveFrom":"2026-01-01T00:00:00.000Z",
    "status":"ACTIVE"
  }' \
  http://localhost:5000/api/v1/admin/typing/exam-versions
```

Copy `data._id` as `EXAM_VERSION_ID`.

## 4. Create an active passage

The passage language must match the candidate's attempt language.

```bash
curl -b admin.cookies -H "Content-Type: application/json" \
  -d '{
    "examId":"EXAM_ID",
    "examVersionId":"EXAM_VERSION_ID",
    "title":"Practice passage 1",
    "language":"english",
    "content":"Typing accuracy and speed are both important skills.",
    "difficulty":"MEDIUM",
    "status":"ACTIVE"
  }' \
  http://localhost:5000/api/v1/admin/typing/passages
```

Copy `data._id` as `PASSAGE_ID`.

## 5. Create the evaluation policy

This example uses the High Court generic evaluator for a 20-mark Bombay High Court exam. The one-mark-per-mistake deduction is only an example; set `marksPerMistake` to the official Bombay High Court rule.

```bash
curl -b admin.cookies -H "Content-Type: application/json" \
  -d '{
    "examVersionId":"EXAM_VERSION_ID",
    "name":"High Court English 2026 scoring",
    "version":1,
    "evaluator":"HIGH_COURT_GENERIC_WPM",
    "measurement":{"unit":"WPM"},
    "duration":{"seconds":600},
    "normalization":"NFC",
    "speed":{"grossMethod":"TOTAL_WORDS","netMethod":"CORRECT_WORDS"},
    "errors":{"method":"WORD_BASED","allowedPercentage":5},
    "penalty":{"method":"NONE","value":0},
    "scoring":{"maximumMarks":20,"marksPerMistake":1},
    "qualification":{"minimumSpeed":30,"maximumErrors":20},
    "rounding":{"method":"ROUND","decimalPlaces":2}
  }' \
  http://localhost:5000/api/v1/admin/typing/evaluation-policies
```

The newest active policy version is attached to attempts when they start. Create a new policy version to change rules for future attempts; existing attempts keep their policy. With this example, 4 mistakes produce 16/20; the deduction value must reflect the official scoring rule.

For an RRB evaluator, use `RRB_NTPC_CBTST`, `RRB_LEGACY_25_30`, or `RRB_40_35_NO_IGNORABLE`. RRB policies must use `WORD_BASED` errors and `NONE` penalty and cannot include `scoring`. Optional RRB settings belong in `evaluatorConfig`, for example:

```json
"evaluatorConfig": {
  "minimumWpm": 30,
  "useIgnorableMistakes": false,
  "ignorableMistakePercentage": 0,
  "deductionWordsPerMistake": 10
}
```

## 6. Create a candidate account (if needed)

Request an email verification code:

```bash
curl -H "Content-Type: application/json" \
  -d '{"email":"candidate@example.com","purpose":"verify_email"}' \
  http://localhost:5000/api/v1/auth/request-otp
```

Verify the emailed six-digit code:

```bash
curl -H "Content-Type: application/json" \
  -d '{"email":"candidate@example.com","otp":"123456"}' \
  http://localhost:5000/api/v1/auth/verify-otp
```

Register, then sign in:

```bash
curl -H "Content-Type: application/json" \
  -d '{"name":"Example Candidate","email":"candidate@example.com","password":"A-strong-password-123"}' \
  http://localhost:5000/api/v1/auth/register

curl -H "Content-Type: application/json" \
  -d '{"email":"candidate@example.com","password":"A-strong-password-123"}' \
  http://localhost:5000/api/v1/auth/login
```

Copy `data.accessToken` from login and use it as `USER_TOKEN` below. Existing verified candidates can start at login.

## 7. Discover active exams, versions, and passages

The exam list is public. Detail, versions, and passage routes require a Bearer token.

```bash
curl http://localhost:5000/api/v1/typing/exams

curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:5000/api/v1/typing/exams/EXAM_ID/versions

curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:5000/api/v1/typing/exam-versions/EXAM_VERSION_ID/passages
```

The passage response includes its content and ID. You can also fetch one passage with `GET /api/v1/typing/passages/PASSAGE_ID`.

## 8. Start an attempt

```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "examId":"EXAM_ID",
    "examVersionId":"EXAM_VERSION_ID",
    "passageId":"PASSAGE_ID",
    "language":"english"
  }' \
  http://localhost:5000/api/v1/typing/attempts
```

Save the returned `data.attemptId` and `data.durationSeconds`. The timer starts on the server when the attempt is created.

## 9. Submit the typed passage

```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "typedText":"Typing accuracy and speed are both important skills.",
    "progressVersion":1
  }' \
  http://localhost:5000/api/v1/typing/attempts/ATTEMPT_ID/submit
```

The response contains common typing metrics under `data.common` and exam scoring and qualification under `data.exam`. If scoring is configured, marks are under `data.exam.score.marks`.

## 10. Retrieve a result later

```bash
curl -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:5000/api/v1/typing/attempts/ATTEMPT_ID
```

Only the candidate who owns the attempt can retrieve it. Repeating the same submit request is safe; a different typed passage cannot replace an existing submission.

## Admin utilities

List and filter exams:

```bash
curl -b admin.cookies \
  "http://localhost:5000/api/v1/admin/typing/exams?page=1&limit=20&status=ACTIVE&language=english"
```

Update an exam:

```bash
curl -X PATCH -b admin.cookies -H "Content-Type: application/json" \
  -d '{"description":"Updated exam information"}' \
  http://localhost:5000/api/v1/admin/typing/exams/EXAM_ID
```

Admin session endpoints are `POST /api/v1/admin/auth/login`, `GET /api/v1/admin/auth/me`, and `POST /api/v1/admin/auth/logout`.
