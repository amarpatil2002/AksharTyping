# Akshar AI backend — JavaScript + server-side sessions

## Requirements
- Node.js 20+
- MongoDB running locally or a MongoDB Atlas database

## Install
```bash
npm install
```

Copy `.env.example` to `.env`. Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the generated value into `SESSION_SECRET`.

## Run
```bash
npm run dev
```
API: `http://localhost:5000`
Health check: `GET /api/v1/health`

## Auth endpoints
- `POST /api/v1/auth/register` body `{ "name": "Student", "email": "student@example.com", "password": "your-password" }`
- `POST /api/v1/auth/login` body `{ "email": "student@example.com", "password": "your-password" }`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

Registration does not automatically log in the user.

## Frontend Axios
Set frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```
Axios:
```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});
```

## Security notes
- MongoDB stores sessions through `connect-mongo`; this does not use Express MemoryStore.
- Keep `.env` out of Git.
- Use HTTPS in production and configure proxy trust and secure cookies correctly if deployed behind a reverse proxy.
- `HttpOnly` prevents JavaScript from reading the cookie but does not by itself prevent CSRF. Review CSRF protection and SameSite settings for your deployment.
- Add rate limiting to login and registration before public launch.
- Never allow users to set their own role to admin.
- Protect each private API endpoint with server-side authentication and authorization. Frontend route guards alone do not secure API data.
