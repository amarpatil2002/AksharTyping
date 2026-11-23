# Typing Exam API Testing Guide

This guide follows the routes and validators currently mounted by `src/app.js`.

## 1. Base URL and setup

Start the API from `server/`:

```powershell
npm run dev
```

Set a Postman environment variable:

```text
baseUrl = http://localhost:5000/api/v1
```

Check that the server is running:

```http
GET {{baseUrl}}/health
```

Expected response:

```json
{ "status": "ok" }
```

The API also needs a working MongoDB connection and `JWT_ACCESS_SECRET`. Candidate signup needs OTP email delivery configured in `.env`. For testing, use a mailbox you can access. Admin login requires an existing user with the `admin` role.

### Admin session

Admin credentials must already exist. Log in before calling endpoints marked as requiring an admin session; Postman should retain the `akshar.admin.sid` cookie automatically:

```http
POST {{baseUrl}}/admin/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "YOUR_ADMIN_PASSWORD"
}
```

The typing admin routes use the same session cookie. `app.js` mounts the session middleware on `/api/v1/typing/admin`.

> **Current route access:** candidate routes require a Bearer token. The admin catalog and policy-attachment routes require an admin session cookie. The admin exam, version, passage, and policy CRUD routes currently have their `requireAdminSession` middleware commented out in `typingExam.routes.js`; they are accessible without a session in this checkout. Re-enable those guards before exposing the API outside a trusted development environment.

## 2. Candidate account and token

If you already have an active candidate account, skip to **Login**.

### Request email verification code

```http
POST {{baseUrl}}/auth/request-otp
Content-Type: application/json
```

```json
{
  "email": "candidate@example.com",
  "purpose": "verify_email"
}
```

Enter the six-digit code delivered to the mailbox:

```http
POST {{baseUrl}}/auth/verify-otp
Content-Type: application/json
```

```json
{
  "email": "candidate@example.com",
  "otp": "123456"
}
```

Register using the same email before the verification record expires:

```http
POST {{baseUrl}}/auth/register
Content-Type: application/json
```

```json
{
  "name": "Typing Candidate",
  "email": "candidate@example.com",
  "password": "ExamplePass123!"
}
```

### Login

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

```json
{
  "email": "candidate@example.com",
  "password": "ExamplePass123!"
}
```

Copy `data.accessToken` from the response into a Postman environment variable named `accessToken`. For candidate typing calls, set:

```http
Authorization: Bearer {{accessToken}}
```

## 3. Create a test policy

Create the policy before the exam version because the version requires a `policyId`.

```http
POST {{baseUrl}}/typing/admin/policies
Content-Type: application/json
```

```json
{
  "name": "Local typing API test policy",
  "version": "test-v1",
  "evaluator": "STANDARD_WORD",
  "stages": [
    {
      "code": "TYPING_STAGE",
      "name": "Typing stage",
      "order": 1,
      "components": [
        {
          "code": "ENGLISH_TYPING",
          "name": "English typing",
          "type": "TYPING_SPEED",
          "language": "english",
          "durationSeconds": 600,
          "maxMarks": 20,
          "measurement": {
            "unit": "WPM",
            "target": 20,
            "minimum": 0,
            "maximum": 200
          },
          "scoring": {
            "method": "PERCENTAGE",
            "maxMarks": 20
          },
          "qualification": {
            "type": "MIN_PERCENTAGE",
            "value": 50,
            "required": true
          }
        }
      ]
    }
  ],
  "errorRules": {
    "caseSensitive": true,
    "punctuationSensitive": true,
    "normalization": "NFC",
    "wordMethod": "PASSAGE_ALIGNMENT",
    "characterUnit": "GRAPHEME_CLUSTERS",
    "includeSpaces": false,
    "includePunctuation": true
  },
  "finalResult": {
    "strategy": "SUM_COMPONENTS",
    "maxMarks": 20,
    "qualification": {
      "type": "MIN_PERCENTAGE",
      "value": 50
    }
  },
  "status": "DRAFT"
}
```

Save `data._id` as `policyId`. Activate it:

```http
POST {{baseUrl}}/typing/admin/policies/{{policyId}}/activate
```

Activation is required before a candidate can start an attempt.

## 4. Create an exam

```http
POST {{baseUrl}}/typing/admin/exams
Content-Type: application/json
```

```json
{
  "title": "Local Typing Practice Exam",
  "slug": "local-typing-practice",
  "description": "Practice exam for API testing",
  "authority": "Local Test Authority",
  "examCode": "LOCAL_TYPING_TEST",
  "postName": "Typing Candidate",
  "recruitmentCycle": "2026",
  "examType": "WORD",
  "language": "english",
  "status": "ACTIVE"
}
```

Save `data._id` as `examId`. `examCode` accepts uppercase letters, digits, and underscores.

## 5. Create an exam version

Use the policy ID from step 3. `name` is not an exam-version field; the policy name was sent to the policy endpoint above.

```http
POST {{baseUrl}}/typing/admin/exam-versions
Content-Type: application/json
```

```json
{
  "examId": "{{examId}}",
  "version": "2026-test-v1",
  "recruitmentCycle": "2026",
  "effectiveFrom": "2026-01-01T00:00:00.000Z",
  "policyId": "{{policyId}}",
  "status": "ACTIVE"
}
```

Save `data._id` as `examVersionId`. The ID fields must be MongoDB ObjectIds returned by earlier create calls.

## 6. Create a passage

The passage must belong to the version and use the component language (`english`). The API calculates `wordCount` and `characterCount` from `content`.

```http
POST {{baseUrl}}/typing/admin/passages
Content-Type: application/json
```

```json
{
  "examVersionId": "{{examVersionId}}",
  "title": "Local practice passage",
  "language": "english",
  "content": "Typing practice helps candidates improve speed and accuracy. Read each word carefully and keep a steady rhythm while completing the passage.",
  "difficulty": "easy",
  "status": "ACTIVE"
}
```

Save `data._id` as `passageId`.

## 7. Discover exams and passages

List active exams:

```http
GET {{baseUrl}}/typing/exams?page=1&limit=20
Authorization: Bearer {{accessToken}}
```

Get an exam by code:

```http
GET {{baseUrl}}/typing/exams/LOCAL_TYPING_TEST
Authorization: Bearer {{accessToken}}
```

List active passages for the version:

```http
GET {{baseUrl}}/typing/passages?examVersionId={{examVersionId}}&language=english&page=1&limit=20
Authorization: Bearer {{accessToken}}
```

## 8. Start and submit an attempt

Start an attempt using the component code configured in the policy:

```http
POST {{baseUrl}}/typing/attempts/start
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "examVersionId": "{{examVersionId}}",
  "passageId": "{{passageId}}",
  "componentCode": "ENGLISH_TYPING",
  "inputMetadata": {
    "keyboardLayout": "QWERTY"
  },
  "clientMetadata": {
    "client": "Postman"
  }
}
```

Save `data._id` as `attemptId`. Wait at least one second after starting, then submit the passage text. The server measures elapsed time and rejects a duration below one second or above the configured component duration (plus a five-second allowance).

```http
POST {{baseUrl}}/typing/attempts/{{attemptId}}/submit
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "typedText": "Typing practice helps candidates improve speed and accuracy. Read each word carefully and keep a steady rhythm while completing the passage.",
  "clientMetadata": {
    "client": "Postman"
  }
}
```

The response contains the evaluation, including alignment, error metrics, speed, accuracy, component score, and qualification. Do not send marks, speed, or duration; those values are computed by the server.

Each candidate can make at most three attempts per component for an exam version.

## 9. Read candidate results and history

```http
GET {{baseUrl}}/typing/me/attempts
Authorization: Bearer {{accessToken}}
```

```http
GET {{baseUrl}}/typing/me/results
Authorization: Bearer {{accessToken}}
```

```http
GET {{baseUrl}}/typing/results/{{examVersionId}}
Authorization: Bearer {{accessToken}}
```

```http
GET {{baseUrl}}/typing/me/dashboard?examVersionId={{examVersionId}}
Authorization: Bearer {{accessToken}}
```

## 10. Admin policy management endpoints

All paths below are relative to `{{baseUrl}}/typing`:

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/catalog` | List supported built-in catalogs (admin session required) |
| POST | `/admin/catalog/install` | Install a built-in exam and draft policy/version (admin session required) |
| GET | `/admin/exams` | List exams; supports `page`, `limit`, `status`, `examType`, `authority`, `language` |
| POST | `/admin/exams` | Create an exam |
| POST | `/admin/exam-versions` | Create a version; requires `examId`, `version`, `recruitmentCycle`, `policyId` |
| POST | `/admin/passages` | Create a passage |
| POST | `/admin/policies` | Create a policy |
| GET | `/admin/policies` | List policies |
| GET | `/admin/policies/:policyId` | Read a policy |
| POST | `/admin/policies/:policyId/revisions` | Create a policy revision |
| POST | `/admin/policies/:policyId/activate` | Activate a policy |
| POST | `/admin/policies/:policyId/retire` | Retire a policy |
| PATCH | `/admin/exam-versions/:versionId/policy` | Attach an active policy to a version (admin session required) |

To install a built-in catalog, post one of these codes to `/admin/catalog/install`:

```json
{ "examCode": "RSSB_LDC_JA" }
```

Other supported codes are `MPSC_GROUP_C` and `BOMBAY_HC_CLERK`. Installation creates or updates catalog data in `DRAFT` state. Inspect and activate the resulting policy/version before using them for candidate attempts.

## 11. Common validation and runtime errors

- `Validation failed`: field names or enum values do not match the endpoint schema. Check the field path in `errors`.
- `Invalid ObjectId`: use an `_id` returned by a prior API response, not an exam code or name.
- `Active evaluation policy not found`: activate the policy before starting attempts.
- `Component is not configured`: `componentCode` must match a policy component, such as `ENGLISH_TYPING`.
- `Passage does not belong to exam version`: create the passage with the same `examVersionId` used to start the attempt.
- `Invalid attempt duration`: wait at least one second before submitting, and keep within `durationSeconds`.
- `Maximum attempts reached`: the candidate has used all three attempts for that component/version.
- Duplicate record response: use a new `slug`, `examCode`, or exam version as appropriate.
