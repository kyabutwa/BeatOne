# Zalagren Live Service Boundary

Status: IMPLEMENTED — deployment verification pending.

Browser → Cloudflare Worker → Neon → Zalagren service endpoints.

## Endpoints
- GET `/` — Zalagren participant-facing shell.
- GET `/api/health` — verifies the Worker can reach Neon and reads the migration ledger.
- GET `/api/foundation` — reads canonical foundation row counts.
- POST `/api/onboarding/participant` — protected bootstrap provisioning of Person → Identity → Participant → Account.

The onboarding endpoint deliberately does not create a Credential or Session. Credential/session authentication remains a separate boundary and must not be faked by a bootstrap endpoint.

## Required production configuration
- `DATABASE_URL`: Neon production connection string.
- `BOOTSTRAP_TOKEN`: protected operator token; never expose it to browser code.

## Completion gate
1. Worker deployment succeeds.
2. `/api/health` returns `status=ok`.
3. `/api/foundation` returns canonical production counts.
4. Protected onboarding creates exactly one Person/Identity/Participant/Account transactionally.
5. Credential/session authentication is implemented and independently verified.
