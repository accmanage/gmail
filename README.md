# Secure Admin - 2FA Inventory & OTP Access Management System

Production-oriented SaaS monorepo for storing already-existing account inventory, assigning access to users, and generating live server-side TOTP codes from encrypted secret keys. It does **not** create Gmail accounts.

## Stack

- Backend: Node.js, Express, Prisma, MySQL, Socket.IO, JWT refresh rotation, otplib
- Admin: React, TailwindCSS, Zustand, Axios, Recharts, Socket.IO client
- User: React, TailwindCSS, Zustand, Axios, mobile-first OTP UI
- Deployment: Docker Compose, Nginx reverse proxy, HTTPS-ready headers/cookies

## Project Layout

```text
apps/
  admin-frontend/
  user-frontend/
  backend/
packages/
  config/
  types/
  ui/
docker/
  docker-compose.yml
  nginx.conf
```

## Security Model

- User passwords are hashed with bcrypt.
- Account passwords, app passwords, and TOTP secret keys are encrypted at rest with AES-256-GCM.
- Users never receive raw secret keys or app passwords.
- JWT access tokens are short-lived and refresh tokens are rotated into server-side sessions.
- RBAC supports `super_admin`, `admin`, `reseller`, and `user`.
- Helmet, CORS allowlisting, secure cookies, CSRF double-submit protection, rate limiting, Zod validation, Prisma query safety, and audit logs are implemented.

## Local Setup

1. Install Node.js 20+ and MySQL 8+.
2. Copy `.env.example` to `.env`.
3. Set strong values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`.
4. Install dependencies:

```bash
npm install
```

5. Run migrations and seed the first admin:

```bash
npm run prisma:generate
npm --workspace apps/backend run prisma:dev
npm --workspace apps/backend run seed
```

6. Start all apps:

```bash
npm run dev
```

Default seeded login:

- Username: `admin`
- Password: `ChangeMe123!`

Change this immediately after first login.

## Docker

Create `.env` from `.env.example`, then run:

```bash
docker compose up --build
```

Open:

- Admin panel: `http://admin.localhost`
- User panel: `http://app.localhost` or `http://localhost`

For production, terminate TLS before or inside Nginx and set `NODE_ENV=production`, strong secrets, strict `CORS_ORIGIN`, and real cookie domain values.

## Core API

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/dashboard/stats`
- `GET|POST|PUT|DELETE /api/users`
- `GET|POST|PUT|DELETE /api/pools`
- `GET|POST|PUT|DELETE /api/accounts`
- `POST /api/accounts/import`
- `GET /api/accounts/export`
- `POST /api/access/assign`
- `POST /api/access/revoke`
- `POST /api/access/cleanup`
- `POST /api/otp/generate`
- `POST /api/preferences/update`
- `POST /api/tracking/heartbeat`
- `GET /api/me/dashboard`
- `GET /api/me/accounts`

## CSV Import

CSV columns:

```csv
email,password,app_password,secret_key,pool_name
user@example.com,accountPassword,appPassword,TOTPSECRET,Fresh Accounts
```

## OTP Flow

Users request an OTP with an assignment id:

```json
{
  "accessId": 123
}
```

The backend validates ownership and expiry, decrypts the stored secret key, generates the TOTP server-side with `otplib`, stores an OTP audit log, emits realtime activity, and returns:

```json
{
  "data": {
    "code": "123456",
    "remaining": 17
  }
}
```

## Notification Architecture

Telegram delivery is implemented via Bot API when `TELEGRAM_BOT_TOKEN` and user `telegram_chat_id` are configured. WhatsApp is modeled as a provider-ready notification channel so a provider adapter can be added without changing application workflows.

## Production Checklist

- Rotate the seeded admin password.
- Use a 32-byte random base64 `ENCRYPTION_KEY` and back it up securely.
- Use managed MySQL backups and encrypted storage.
- Configure TLS certificates in Nginx.
- Set exact `CORS_ORIGIN` values for admin and user domains.
- Run `npm run build` in CI.
- Monitor audit logs, session volume, OTP request rate limits, and failed login rates.
