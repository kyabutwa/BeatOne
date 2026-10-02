# Zalagren Live Service

Status: IMPLEMENTED — authentication/onboarding/home committed; deployment verification pending.

## Runtime boundary

Browser → Cloudflare Worker → Neon Managed Better Auth → canonical BeatCore persistence → participant home.

The authentication provider boundary is frozen at Neon Managed Better Auth. It owns password verification and provider sessions. BeatCore remains authoritative for application identity, Participant, Account, Credential metadata, and canonical Session records.

## Production configuration

- `DATABASE_URL`: Neon production Postgres connection string.
- `NEON_AUTH_BASE_URL`: optional override; production defaults to the branch-scoped Neon Auth endpoint.
- `BOOTSTRAP_TOKEN`: temporary operator-only fallback for controlled provisioning. Public onboarding does not depend on it.

## Implemented routes

- `GET /` — Zalagren participant-facing entry/home shell.
- `POST /api/auth/sign-up/email` — real email/password signup through Neon Managed Better Auth.
- `POST /api/auth/sign-in/email` — real email/password sign-in through Neon Managed Better Auth.
- `POST /api/auth/sign-out` — provider session sign-out.
- `GET /api/me` — provider-session validation plus canonical participant resolution.
- `GET /api/health` — Neon connectivity and migration ledger health.
- `GET /api/foundation` — canonical persistence counts.
- `POST /api/onboarding/participant` — protected operator fallback only.

## Canonical synchronization

A successful provider-authenticated user is reconciled into:

Identity → Person → Participant → Account → Credential metadata → canonical Session.

Provider credentials and provider session machinery remain in the frozen Neon Auth boundary. No provider password/hash is stored in BeatCore.

## Completion gate

1. GitHub CI passes the committed Worker/BeatCore source.
2. Worker is deployed to Cloudflare with production `DATABASE_URL`.
3. Production Worker health and foundation endpoints succeed.
4. A disposable test account can sign up/sign in/sign out without leaving test rows.
5. A controlled real account can complete signup → authenticated `/api/me` → participant home.
6. Only after that do we move to the first complete Zalagren service lifecycle.

No new persistence migration is required for this slice.
