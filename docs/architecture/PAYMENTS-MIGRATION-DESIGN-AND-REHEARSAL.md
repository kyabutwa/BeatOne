# Payments Migration Design + Non-Production Rehearsal Plan

Status: 🔵 PROPOSED — REVIEWABLE SOURCE IMPLEMENTED; PRODUCTION CLOSED

## Boundary

This migration establishes canonical `public.payments` while retaining the existing legacy `payment_intents` and `payment_events` tables unchanged.

Legacy disposition remains **RETAIN + DEPRECATE** because both tables are currently empty and historical migration source is not recoverable.

No legacy payment data transformation is authorized by this migration.

## Dependency

The Payments migration requires the canonical Action physical schema first.

The disposable rehearsal therefore applies, in order:

1. Action canonicalization migration;
2. Payments canonicalization migration;
3. canonical Payment runtime verification.

Production must use the same ordering, but production execution is not authorized by this document.

## Canonical Payments table

The source creates only `public.payments` with:

- canonical Payment ID;
- optional payer/payee participant references;
- exact `numeric` amount;
- uppercase three-letter currency;
- Payment-owned status;
- actor and authorization references;
- optional canonical `action_id`;
- globally unique idempotency key;
- request/correlation/causation references;
- atomic external provider/reference pair;
- timestamps;
- optimistic-concurrency version.

It creates no `payment_action`, `payment_events`, or `payment_evidence` tables.

## Chain preservation

The physical Payments boundary is:

Payment → canonical Action

The canonical Action remains the BeatCore operation boundary. Events and Evidence remain the existing canonical BeatCore tables and are not duplicated or repurposed by this migration.

The current live Event/Evidence physical schemas do not expose the full canonical application Action/Event/Evidence linkage, so this migration deliberately does not invent new Event/Evidence columns. That physical reconciliation remains a separate foundation concern.

## Safety guards

The migration aborts if:

- migration ledger is missing;
- migration ID is already registered;
- `payments` already exists;
- either legacy Payments table is missing;
- either legacy Payments table contains rows;
- canonical Action physical schema is absent.

The migration registers its ID only after successful table/index creation.

## Non-production verification

On a disposable Neon branch cloned from production:

- apply Action canonicalization first;
- apply Payments canonicalization;
- verify schema/FKs/indexes/legacy-table preservation;
- insert a valid Payment referencing a real controlled Action and matching authorization;
- verify duplicate Payment idempotency rejection;
- verify stale version compare-and-swap rejection;
- verify actor/authorization mismatch is rejected by the canonical application boundary where applicable and distinguish this from DB-only FK existence;
- verify action linkage;
- verify UNKNOWN/PENDING/RECONCILIATION_REQUIRED remain distinct from COMPLETED;
- verify provider/reference atomicity;
- verify migration rollback with an intentional failure;
- verify rerun guard;
- delete the disposable branch.

Production remains untouched.

## Gate

The migration is not production-approved merely because the disposable rehearsal succeeds. Production requires:

Action migration verified → Payments migration source reviewed → Payments disposable rehearsal verified → application/runtime compatibility → explicit production authorization.
