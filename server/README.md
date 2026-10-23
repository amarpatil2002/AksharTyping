# Akshar AI future-ready backend (JavaScript)

## Architecture
- One Express API serves both student/client and admin frontends.
- `User` stores profile, role, status, and optional password hash.
- `AuthIdentity` links a user to a login provider (`password`, future `google`).
- `connect-mongo` stores server-side sessions.
- Student/admin access is enforced by backend middleware, not only React routes.

## Setup
1. Use Node.js 20+ and have MongoDB running locally or use MongoDB Atlas.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set it as `SESSION_SECRET`.
5. Run `npm run dev`.

## API
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/student/dashboard` (student role)
- `GET /api/v1/admin/dashboard` (admin role)
- `GET /api/v1/health`

## Frontend
Set frontend `.env`:
`VITE_API_URL=http://localhost:5000`

Axios instance:
```js
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});
```

## Google login later
Google login is prepared structurally, not yet active. When implementing it:
1. Use a maintained OAuth/OIDC library and configure Google client ID, secret, callback URL.
2. Validate OAuth state and the returned identity; require verified email as appropriate.
3. Find or create a `User` and create an `AuthIdentity` with `provider: "google"` and Google's stable `sub` as `providerUserId`.
4. Do not blindly link Google to an existing account based only on an unverified email.
5. Regenerate the session after successful OAuth and set `req.session.userId`.
6. Redirect to the correct frontend route using a server-controlled allowlist.

## Security before production
- Configure HTTPS, trusted proxy settings, secure cookie settings, CORS origins, and CSRF protections for your actual deployment.
- Never let a client choose its own `role`; new users always get `student`.
- Create/promote admin accounts through a trusted seed script or controlled manual operation.
- Add email verification, password reset, audit logs, and monitoring as needed.
- Review rate limits for your real traffic and shared-IP environments.
