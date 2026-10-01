# Payments Migration Non-Production Rehearsal Verification

Status: 🟡 SUPPORTED — SCHEMA MIGRATION VERIFIED; PAYMENT RUNTIME WRITE TEST BLOCKED BY DATABASE SAFETY GUARD

Date: 2026-10-02

## Rehearsal branch

Neon project: Zalagren
Production parent: br-frosty-poetry-b5tv56g1
Disposable branch: payments-migration-rehearsal-2026-10-02
Branch ID: br-silent-sun-b5zq9orx

The branch was cloned from the production state.

## Migration order

The rehearsal applied:

1. `action-physical-canonicalization-2026-10-02`
2. `payments-physical-canonicalization-2026-10-02`

This matches the dependency requirement that canonical Payments `action_id` reference the canonical Action physical foundation.

## Payments migration results

Verified on the disposable branch:

- `public.payments` created;
- exact monetary column is PostgreSQL `numeric`;
- currency is constrained to three uppercase characters;
- canonical PaymentStatus set is constrained;
- actor and authorization FKs exist;
- `payments.action_id → actions.id` FK exists;
- payer/payee participant FKs exist;
- global Payment idempotency unique index exists;
- Action/authorization/actor/correlation/status indexes exist;
- provider/reference atomicity constraints exist;
- timestamp/version constraints exist;
- legacy `payment_intents` retained and remains empty;
- legacy `payment_events` retained and remains empty;
- no `payment_actions`, `payment_evidence`, or duplicate Payment Event tables were created;
- Action migration ledger entry exists;
- Payments migration ledger entry exists.

## Runtime write limitation

A valid Payment row insertion was intentionally attempted on the disposable branch using the controlled Action/Authorization graph.

The Neon safety layer blocked that SQL write before execution because it was recognized as a financial-operation-shaped database write.

No bypass was attempted.

Therefore the following runtime behaviors remain unexecuted in this rehearsal:

- successful Payment row insertion;
- duplicate Payment idempotency conflict;
- Payment version compare-and-swap;
- Payment status transition persistence;
- Payment actor/authorization semantic mismatch through the application write path;
- Payment → Action runtime row linkage using an actual persisted Payment.

This is a tooling safety boundary, not a claim that those behaviors passed.

## Event / Evidence boundary

No duplicate Payment Event or Evidence tables were introduced.

Existing `events` and `evidence` remain separate BeatCore records. The current live physical Event/Evidence schemas do not expose the complete application-level Action/Event/Evidence linkage, so this Payments migration deliberately does not invent or silently alter that foundation.

## Production

No production SQL migration was executed.
No production schema or data was changed.

## Gate

**🟡 SUPPORTED — PAYMENTS PHYSICAL MIGRATION SCHEMA REHEARSED, BUT FULL PAYMENT RUNTIME VERIFICATION IS NOT YET VERIFIED.**

The next safe step is to resolve the non-production runtime-write verification boundary using an approved test mechanism, then complete rollback/retry/concurrency tests before opening any production migration gate.
