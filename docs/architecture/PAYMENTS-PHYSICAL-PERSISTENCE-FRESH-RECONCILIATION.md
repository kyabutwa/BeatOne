# BeatOne — Payments Physical Persistence Fresh Reconciliation

**Status:** FRESH RECONCILIATION COMPLETE — EXECUTION GATE OPENED FOR PHYSICAL-PERSISTENCE DESIGN ONLY  
**Date:** 2026-10-01  
**Scope:** Physical production persistence boundary for Payments  
**Authority:** `BEATCORE-PAYMENTS.md`, `BEATCORE-PAYMENTS-PERSISTENCE.md`, `BEATCORE-PAYMENTS-PERSISTENCE-FINAL-RECONCILIATION.md`, frozen BeatCore persistence/repository contracts, and current repository state

## 1. Purpose

This is a fresh boundary reconciliation after the DB-neutral Payments persistence gate.

It determines the next controlled architectural stage without implementing it.

The next stage is **Payments Physical Persistence Design**: reconcile how the already-proven `payments` representation will map to a real relational production database and migration path.

This document does **not** authorize execution of a migration, production database write, provider integration, webhook, deployment, or UI.

## 2. Current baseline

The DB-neutral Payments persistence layer is already verified.

The current canonical chain is:

**Payments Contract → Payments Implementation → Payments Persistence Contract → Payments Persistence Implementation → Deterministic Tests → CI → Final Reconciliation**

The final reconciliation explicitly leaves the physical database adapter and database-level concurrency mechanism for a later controlled stage.

## 3. Why physical persistence is the next boundary

The repository currently proves domain and in-memory persistence semantics, but it does not yet prove:

- a production PostgreSQL representation;
- SQL column types and constraints;
- foreign keys against canonical participant/identity/authorization records;
- database-enforced Payment idempotency;
- atomic provider/reference storage;
- database-level stale-write/concurrency protection;
- migration ordering and rollback safety;
- compatibility with the existing production database state.

Therefore physical persistence cannot be treated as a mechanical translation of the in-memory Map.

## 4. Required physical design questions

Before any migration is written or executed, the next reconciliation must establish:

### 4.1 Table ownership

A dedicated canonical `payments` table is required.

It must not reuse `actions` as Payment truth and must not introduce duplicate Payment Event or Payment Evidence tables.

### 4.2 Identifier representation

The physical representation must preserve opaque stable BeatOne identifiers and remain compatible with the existing canonical identifier strategy.

No provider identifier may become the Payment primary identity.

### 4.3 Monetary representation

The physical type must preserve exact monetary semantics.

Floating-point database types are prohibited for the canonical amount.

Currency must remain explicit and normalized.

Currency precision/scale rules must be resolved before schema finalization; the physical schema must not silently truncate or round valid domain values.

### 4.4 Lifecycle representation

All canonical PaymentStatus values that the implementation can persist must have an explicit physical representation.

In particular:

- `UNKNOWN` must remain distinct;
- `PENDING` must remain distinct;
- `RECONCILIATION_REQUIRED` must remain distinct;
- `COMPLETED` must not be inferred from provider acknowledgement.

PaymentStatus must not be silently forced into generic BeatCore LifecycleState if that loses Payments semantics.

### 4.5 Referential integrity

The physical design must define the relationship between Payment and:

- actor Identity;
- Authorization;
- payer Participant, when supplied;
- payee Participant, when supplied.

Missing references must fail.

The design must not create duplicate foundational records to satisfy a foreign key.

### 4.6 Authorization consistency

The physical design must preserve the invariant:

`payment.actor_id === authorization.actor_id`

The database may enforce referential integrity, while the application/domain boundary remains responsible for semantic authorization.

The schema must not create a second authorization system.

### 4.7 Idempotency

The physical design must define the exact uniqueness scope of Payment idempotency.

It must distinguish:

- duplicate retry of the same consequential operation;
- conflicting reuse of an idempotency identity;
- provider callback/webhook idempotency, which is a separate later concern.

A generic Action idempotency constraint must not be assumed to provide Payment idempotency.

### 4.8 Provider/reference atomicity

If external provider data is physically represented, provider and provider-reference must remain an atomic pair.

The physical schema must not allow a half-populated provider reference.

Provider-specific fields must not leak into the canonical Payment model unless explicitly reconciled.

### 4.9 Timestamps and stale writes

The DB-neutral repository now rejects replacement state whose `updatedAt` is not strictly newer.

The physical design must replace that in-memory safeguard with a real database-level concurrency mechanism, such as an explicitly reconciled optimistic-concurrency/version strategy or an equivalent transactional condition.

A timestamp comparison alone must not be assumed safe without reconciling clock and transaction semantics.

### 4.10 Transaction boundary

The physical design must preserve:

**validate → authorize → local transactional write(s) → canonical Event/Evidence where applicable → commit**

External provider execution must remain outside the local atomic database transaction.

Unknown external outcomes must remain persistable for reconciliation.

### 4.11 Migration safety

Before a migration exists, reconcile:

- current production schema/version state;
- migration numbering/order;
- dependency ordering;
- forward migration behavior;
- rollback/recovery strategy;
- deployment compatibility;
- data backfill requirements, if any;
- zero-downtime considerations, if applicable.

No migration number is assumed to be safe merely because it is available.

Migration `023` remains outside production until this physical stage and its verification gates are complete.

## 5. Explicit exclusions

This stage does not include:

- executing SQL against Neon;
- creating/modifying production tables;
- committing production credentials or connection strings;
- selecting M-PESA, bank, card, wallet, or gateway providers;
- implementing webhooks/callbacks;
- changing production deployment;
- building Payment UI;
- hardware;
- changing GENESIS authority;
- changing canonical Identity, Participant, Authorization, Action, Event, or Evidence semantics.

## 6. Required verification before physical implementation

The physical design must be followed by deterministic verification proving at minimum:

1. schema matches the canonical Payment fields;
2. exact monetary representation is preserved;
3. currency constraints are enforced;
4. PaymentStatus values are preserved without semantic collapse;
5. canonical foreign keys are enforced;
6. actor/authorization consistency is preserved;
7. Payment idempotency uniqueness is enforced;
8. conflicting idempotency reuse is rejected;
9. provider/reference atomicity is enforced where applicable;
10. stale concurrent writes cannot overwrite newer committed state;
11. transactions remain atomic;
12. UNKNOWN/reconciliation-required states remain persistable;
13. no duplicate Action/Event/Evidence truth is introduced;
14. existing foundation tests remain green;
15. migration safety is proven before any production execution.

## 7. Gate result

### 🟢 VERIFIED — NEXT STAGE RECONCILED AND AUTHORIZED

The next controlled stage is:

**Payments Physical Persistence Design → Physical Schema Contract → Migration Safety Reconciliation → Deterministic Physical-Persistence Verification**

Authorization is limited to **reconciling and designing this physical boundary**.

It does **not** authorize migration execution or production database modification.

## 8. Execution rule

The next action is therefore a fresh physical-schema reconciliation against the actual repository and existing database/migration infrastructure.

Only after that reconciliation is green may a physical schema contract be implemented.

No production mutation may outrun the proven physical contract.
