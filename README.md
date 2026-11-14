# OmniAgent AI

Multi-account AI customer-support platform with a unified inbox, automatic replies, human takeover, PostgreSQL storage, and platform adapters.

## Platform capability reality

| Platform | Incoming messages | Outgoing replies | Notes |
|---|---|---|---|
| WhatsApp | Official Cloud API webhooks | Cloud API | Requires Meta app, WhatsApp Business account, phone-number ID, token and approved permissions/templates where applicable. |
| Instagram | Meta webhooks, eligible professional accounts | Instagram Messaging API | Requires eligible professional account, Meta app review/permissions and supported messaging access. |
| Facebook | Page webhooks | Messenger Send API | Requires Facebook Page, app review/permissions and Page access token. |
| Telegram | Bot webhook or polling-compatible webhook | Bot API | Requires a bot token from BotFather. |
| TikTok | Not generally available for arbitrary DMs | Not generally available for arbitrary DMs | Connector is intentionally capability-gated. TikTok's public developer APIs do not provide a general, unrestricted DM customer-support API. Do not use scraping, browser automation or unofficial endpoints. |

The app includes adapters and account configuration for all five. TikTok is a documented placeholder until an approved TikTok product/API is available to your account for the exact messaging use case.

## Stack

- Frontend: Next.js App Router, React, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- AI: OpenAI Responses API through the official SDK
- Authentication: JWT access token + bcrypt password hashing
- Platform webhooks: Meta, Telegram
- Deployment: Docker Compose (PostgreSQL + API + frontend)

## Repository layout

```text
omniagent-ai/
  backend/          Express API, adapters, webhook handlers, AI service
  frontend/         Next.js dashboard
  database/         SQL schema
  docs/             API inventory and platform setup notes
  scripts/          database/bootstrap helpers
  docker-compose.yml
  .env.example
```

## Quick start on Android / Termux

Use a current Termux build from F-Droid or the official GitHub releases. Do not mix APK sources.

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git python nano unzip -y
node --version
npm --version
```

Extract the ZIP (adjust the path if your download folder differs):

```bash
termux-setup-storage
mkdir -p ~/projects
cp ~/storage/downloads/omniagent-ai.zip ~/projects/
cd ~/projects
unzip omniagent-ai.zip
cd omniagent-ai
```

Install PostgreSQL locally if your Termux repository provides it:

```bash
pkg install postgresql -y
initdb "$PREFIX/var/lib/postgresql"
pg_ctl -D "$PREFIX/var/lib/postgresql" -l "$PREFIX/var/lib/postgresql/logfile" start
createdb omniagent
```

If the Termux PostgreSQL package is unavailable or inconvenient, use a hosted PostgreSQL provider such as Neon and copy its connection string into `backend/.env`.

Set up backend:

```bash
cd ~/projects/omniagent-ai/backend
cp .env.example .env
nano .env
npm install
npm run db:migrate
npm run dev
```

Set up frontend in a second Termux session:

```bash
cd ~/projects/omniagent-ai/frontend
cp .env.example .env.local
nano .env.local
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

### First admin user

After the API is running, register through the dashboard or:

```bash
curl -X POST http://127.0.0.1:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@example.com","password":"ChangeThisStrongPassword123!"}'
```

Registration creates a workspace and the first user. For a real deployment, disable public registration after creating the owner account (set `ALLOW_REGISTRATION=false` and restart).

## Environment configuration

Copy `backend/.env.example` to `backend/.env`. Never commit `.env` files. `frontend/.env.local` contains only the public API base URL.

Required for core local use:
- `DATABASE_URL`
- `JWT_SECRET` (long random secret)
- `OPENAI_API_KEY` for AI-generated replies

Optional platform credentials are configured per connected account through the dashboard/API. Platform secrets are stored in the database in this starter implementation; use a managed secret vault and envelope encryption before production deployment. Do not expose account secrets to frontend responses.

## Run with Docker

Docker Desktop or a remote Docker host is generally more practical than Docker directly on Android.

```bash
cp backend/.env.example backend/.env
# Edit backend/.env; set DATABASE_URL=postgres://omniagent:omniagent@postgres:5432/omniagent
docker compose up --build
```

Frontend: `http://localhost:3000`; API: `http://localhost:4000/health`.

## Human takeover behavior

- Every conversation has `mode = ai` or `mode = human`.
- AI replies only when the conversation mode is `ai`.
- `POST /api/v1/conversations/:id/takeover` changes mode to `human`.
- `POST /api/v1/conversations/:id/return-to-ai` changes mode to `ai`.
- A human reply can be sent through `POST /api/v1/conversations/:id/messages`.
- Add an explicit consent, escalation and retention policy before connecting real customer channels.

## Security checklist before production

1. Use HTTPS and a publicly reachable webhook URL.
2. Set strong random JWT and encryption secrets.
3. Implement encrypted-at-rest platform credentials (KMS/envelope encryption); this starter does not claim to provide that.
4. Add rate limiting, CSRF protection if using cookies, audit logs, backup/restore and monitoring.
5. Restrict CORS to your real dashboard domain.
6. Complete Meta/TikTok platform reviews and permissions as applicable.
7. Respect platform messaging windows, templates, user consent, opt-outs and local privacy law.
8. Do not send sensitive customer data to an AI provider without an appropriate lawful basis and safeguards.
9. Review AI replies before enabling automatic mode for real customers.
10. Configure webhook retry/idempotency and operational alerting for production.

## Development status

This is a runnable starter/MVP scaffold, not a claim that platform app reviews, API credentials, production secret management, or all platform permissions are already supplied. Add credentials and complete each platform's approval process.
