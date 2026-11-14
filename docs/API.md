# API endpoint inventory

Base URL: `/api/v1`. Authenticated routes require `Authorization: Bearer <JWT>`.

## Health
- `GET /health` — API and database health (outside `/api/v1`).

## Authentication
- `POST /auth/register` — create workspace owner; body `{name,email,password}`.
- `POST /auth/login` — body `{email,password}`.

## Platform accounts (authenticated)
- `GET /accounts` — list workspace accounts; secrets are not returned.
- `POST /accounts` — create account. Body `{platform,displayName,externalAccountId?,credentials?,config?,enabled?}`.
- `PATCH /accounts/:id` — update account.
- `DELETE /accounts/:id` — remove account.

Credentials examples:
- WhatsApp: `credentials: { "accessToken": "..." }`; `config: { "phoneNumberId": "...", "verifyToken": "..." }`
- Instagram: `credentials: { "accessToken": "..." }`; `config: { "instagramAccountId": "..." }`
- Facebook: `credentials: { "accessToken": "..." }`; `config: { "pageId": "..." }`
- Telegram: `credentials: { "botToken": "..." }`; configure webhook path `/api/v1/webhooks/telegram/:accountId`.
- TikTok: account metadata only; general DM auto-reply remains disabled unless a future approved adapter explicitly supports it.

## Conversations (authenticated)
- `GET /conversations` — latest 200 conversations in workspace.
- `GET /conversations/:id/messages` — messages for a conversation.
- `POST /conversations/:id/takeover` — set mode to human.
- `POST /conversations/:id/return-to-ai` — set mode to AI.
- `POST /conversations/:id/messages` — send a human reply; body `{text}`.

## Webhooks (public; must be HTTPS in production)
- `GET /webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` — Meta verification.
- `POST /webhooks/meta` — Meta event receiver.
- `POST /webhooks/telegram/:accountId` — Telegram update receiver. Add a secret-token check and set it with Telegram `setWebhook` before production.

## Important implementation notes

- Meta webhook receiver acknowledges quickly and processes asynchronously in the request handler. Production should move processing to a durable queue and verify `X-Hub-Signature-256` against the raw request body.
- Current Meta event normalization is a starter implementation and must be validated against the exact subscribed products/event payloads for your app. WhatsApp and Instagram/Facebook payloads differ.
- Add pagination, role checks, audit logs, per-account rate limits and idempotent delivery retries before production.
- The starter stores credentials in JSONB. The API omits them from account list responses, but database-level encryption and strict operational controls are still required.
