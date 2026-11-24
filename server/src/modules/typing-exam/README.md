# Typing Exam Module

Production-oriented typing exam module for Node.js + Express + Mongoose.

## Included

- Separate admin and user routes
- Separate controllers
- Separate validators
- Separate core-result calculator
- Separate official/exam-specific calculator
- Policy-driven exam rules
- Mongoose models
- Server-side elapsed time
- Idempotent submission
- SHA-256 submitted text hash
- Core result:
  - expected words
  - typed words
  - correct
  - incorrect
  - missing
  - extra
  - errors
  - gross WPM
  - net WPM
  - accuracy %
  - error %
- Exam-specific result
- BHC Clerk English policy
- MPSC Group-C Clerk-Typist Marathi policy
- MPSC Group-C Clerk-Typist English policy

## Routes

Admin:

GET  /policies
POST /exams
GET  /exams
PATCH /exams/:examId/status

POST /passages
GET  /passages
PATCH /passages/:passageId/status

User:

POST /exams/:examCode/start
POST /attempts/:attemptId/submit
GET  /results/:resultId

## Integration

Mount the routes from your existing app/server:

```js
app.use("/api/admin/typing", adminTypingRoutes);
app.use("/api/typing", userTypingRoutes);
```

Authentication middleware is intentionally not included. The user controller expects:

```js
req.user.id
```

Attach your existing authentication middleware before the user routes.

## Important

The core result is always calculated.

The official result is only calculated when the configured policy contains a supported rule. BHC is deliberately marked as unavailable for the published marks-conversion formula rather than inventing an official marks formula.

## Dependencies

```bash
npm install express mongoose
```
