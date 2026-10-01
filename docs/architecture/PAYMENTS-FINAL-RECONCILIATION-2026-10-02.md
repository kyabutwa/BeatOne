# Payments Final Reconciliation — 2026-10-02

Status: 🟡 SUPPORTED — FINAL RECONCILIATION PERFORMED; FULL RUNTIME/PHYSICAL GATE REMAINS OPEN

## Scope

This reconciliation covers the canonical Payments contract, DB-neutral implementation, physical PostgreSQL schema source, disposable Neon rehearsal, Action dependency, and the current production boundary.

## Verified

- Payments remains provider-neutral and higher-domain-owned.
- Payment is distinct from canonical Action/Event/Evidence.
- `Payment.actionId` / `payments.action_id` is the canonical Action link.
- No duplicate `payment_action`, Payment Event, or Payment Evidence entity was introduced.
- Legacy `payment_intents` and `payment_events` remain retained/deprecated.
- Canonical Payments migration source exists at `migrations/payments-physical-canonicalization-2026-10-02.sql`.
- The migration requires canonical Action physical persistence first.
- Disposable Neon schema rehearsal successfully created canonical `payments`.
- Disposable rehearsal verified Payment foreign-key/index/constraint shape and preserved the legacy tables.
- The Payments migration source is guarded against non-empty legacy Payment tables.
- Production migration ledger remains through 022; no Payments migration has been registered in production.
- Production schema/data remains untouched by the new Payments migration source.

## Runtime gate still open

The disposable Neon environment's SQL safety boundary blocked an actual Payment-row insertion because the operation was classified as a financial-operation-shaped write.

No bypass was attempted.

Consequently these physical-runtime invariants are not claimed as verified against PostgreSQL:

- successful Payment row insertion;
- duplicate Payment idempotency conflict;
- Payment version compare-and-swap;
- actual persisted Payment → Action linkage;
- Payment status persistence;
- rollback of a transaction containing a real Payment row.

The existing DB-neutral Payments tests already cover authorization, actor mismatch, idempotency conflict, exact money/currency validation, provider-reference atomicity, UNKNOWN/reconciliation states, transaction rollback, and stale replacement behavior.

## Newly identified implementation alignment item

The physical PostgreSQL Payments schema contains `version bigint` for optimistic concurrency, while the current DB-neutral `StoredPayment` / repository representation does not yet carry a `version` field.

This is a real application-to-physical contract alignment gap. It must be resolved before a production PostgreSQL adapter can honestly claim end-to-end version concurrency compatibility.

No production schema change is made to solve it in this reconciliation.

## Authorization boundary

The application-level Payment creation path enforces:

`payment.actorId === authorization.actorId`

The physical schema enforces reference existence, but does not independently encode the full semantic equality invariant. This remains an application/domain responsibility and must be preserved by the eventual physical adapter.

For a linked Payment:

`payment.actor_id === action.actor_id`

and

`payment.authorization_id === action.authorization_id`

remain required semantic invariants.

## Event/Evidence boundary

The Payments migration creates no Event or Evidence tables and does not collapse Payment, Action, Event, or Evidence into one record.

The current physical Event/Evidence layer still requires its own later reconciliation for full end-to-end physical canonicalization. Payments does not invent that missing foundation.

## Production gate

**🔴 CLOSED**

No production Payments migration execution is authorized by this reconciliation.

## Final state

**🟡 SUPPORTED — Payments schema migration design and disposable schema rehearsal are sound, but full Payments runtime physical verification is not closed.**

The next exact controlled stage is:

**PAYMENTS RUNTIME PHYSICAL ADAPTER/TEST ALIGNMENT**

1. add physical `version` to the DB-neutral persistence contract/adapter model;
2. exercise Payment runtime through an approved non-production test mechanism;
3. verify idempotency, version CAS, Action linkage, authorization semantics, and rollback;
4. perform final reconciliation again;
5. only then open the explicit production migration readiness gate.

No provider integration, UI, hardware, new domain, or production migration should begin before this gate is closed.
