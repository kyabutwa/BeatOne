# Action Physical Persistence Reconciliation + Migration Source Governance

**Status:** 🟡 SUPPORTED — PHYSICAL ACTION MIGRATION DESIGN GATE NOT YET OPEN  
**Date:** 2026-10-02  
**Production mutation:** NONE  
**Migration SQL:** NONE CREATED OR EXECUTED

## 1. Canonical Action contract

The verified repository Action contract defines the canonical Action record as:

- id
- actorId
- optional proposalId
- authorizationId
- state
- operation
- optional contextId
- optional correlationId
- optional idempotencyKey

Core invariants require an existing Identity and Authorization, persisted Authorization as authority source, ALLOW and validity at operation time, actor equality, valid optional Proposal/Context, canonical lifecycle transitions, unique Action idempotency keys, and separation of Action from Event and Evidence.

The DB-neutral StoredAction already matches this contract.

## 2. Live PostgreSQL Action state

Read-only inspection was performed against Neon project Zalagren, branch br-frosty-poetry-b5tv56g1, database neondb.

Current public.actions columns:

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | text | NO | — |
| participant_id | text | NO | — |
| context_id | text | NO | — |
| capability_id | text | NO | — |
| action | text | NO | — |
| created_at | timestamptz | NO | now() |

Current physical constraints include:

- primary key on id;
- participant_id → participants.id;
- context_id → contexts.id;
- capability_id → capabilities.id;
- (context_id, participant_id) → contexts(id, participant_id);
- (capability_id, action) → capabilities(id, action);
- non-null checks on the existing fields.

Current live counts:

- actions: 0
- authorizations: 0
- participants: 22
- identities: 22
- events: 0
- evidence: 0

## 3. Reconciliation result

The live Action table is not the canonical physical representation.

It lacks actor_id, proposal_id, authorization_id, state, operation, correlation_id, and idempotency_key.

It instead contains legacy/domain-specific participant_id, capability_id, and action fields.

No unsafe alias is assumed:

- participant_id ≠ actor_id;
- capability_id ≠ authorization_id;
- action ≠ operation.

## 4. Data-migration consequence

The live actions table contains zero rows. Therefore no existing Action records require transformation or backfill.

This does not authorize destructive production schema changes. Dependencies, application compatibility, constraints, and migration history still require explicit reconciliation.

## 5. Canonical physical Action target

Before Payments can safely use payments.action_id, the physical Action target must establish at minimum:

- id text primary key;
- actor_id text not null → identities.id;
- proposal_id text nullable → proposals.id;
- authorization_id text not null → authorizations.id;
- state representing the canonical BeatCore lifecycle;
- operation text not null;
- context_id text nullable → contexts.id;
- correlation_id text nullable;
- idempotency_key text nullable with canonical uniqueness semantics;
- creation/update or version metadata required by the final physical persistence design.

Exact SQL types, indexes, delete behavior, and concurrency mechanism remain part of the dedicated physical schema design and are not authored here.

## 6. Authorization integrity

The physical relationship must preserve actions.authorization_id → authorizations.id.

The application transaction must enforce actions.actor_id = authorizations.actor_id using the persisted Authorization as authority source.

No parallel authorization record or weakened authorization boundary is permitted.

## 7. Action/Event boundary

The physical design must preserve:

Authorization → Action → Event → Evidence

AUTHORIZED means the operation passed the authorization gate; it does not mean an external or real-world operation completed.

No duplicate Event/Evidence tables may be introduced, and the legacy actions.action field must not be treated as an Event.

## 8. Payments dependency

The approved Payments contract contains optional Payment.actionId.

That reference becomes physically safe only after canonical Action persistence exists.

The dependency is:

canonical authorizations → canonical actions → payments.action_id → canonical events/evidence

Request-level Payments may have no Action and therefore may keep action_id nullable. A consequential Payment entering the authorized execution path requires a canonical Action reference.

## 9. Migration-source governance

The repository currently lacks authoritative SQL source for the already-applied production migration IDs through 022.

Future production migrations therefore require:

1. a committed source artifact in one canonical migration directory;
2. a unique deterministic migration identifier;
3. a reviewable GitHub change before production execution;
4. deterministic registration in public.zalagren_schema_migrations when applied;
5. forward verification on a disposable/non-production database or Neon branch before production;
6. explicit compatibility and recovery considerations;
7. no reuse of an already-applied identifier.

For unrecovered historical migrations:

- preserve the live ledger as applied-state evidence;
- do not fabricate historical SQL;
- do not assign 023 retroactively;
- do not claim historical reproducibility until authoritative source is recovered.

## 10. Migration numbering

Migration 023 remains unassigned.

A future migration identifier is selected only after Action physical design, migration-source governance, dependency ordering, and legacy dispositions are settled.

No SQL migration file is created by this reconciliation.

## 11. Remaining verification before physical Action design

1. Inspect all repository/runtime references to the legacy Action columns/table.
2. Reconcile whether the existing empty actions table can be replaced in place or must be preserved under a compatibility name.
3. Reconcile all existing foreign-key dependencies into actions.
4. Define canonical Action physical types, constraints, indexes, and concurrency semantics.
5. Define the exact migration-source directory and registration mechanism.
6. Produce the physical Action schema contract.
7. Return to Payments migration design only after canonical Action persistence is settled.

## 12. Gate

### 🟡 SUPPORTED — ACTION PHYSICAL MISMATCH CONFIRMED; MIGRATION DESIGN STILL CLOSED

Resolved:

- canonical Action contract reconciled;
- live Action schema inspected;
- live Action row count confirmed as zero;
- exact legacy/canonical mismatch confirmed;
- no unsafe field aliasing assumed;
- Payments dependency on canonical Action made explicit;
- migration-source governance requirements established;
- no migration SQL created;
- no production database mutation performed.

Not authorized:

- altering public.actions;
- creating the canonical physical Action table;
- selecting migration 023;
- creating Payments migration SQL;
- executing any production migration.

### Next exact controlled stage

**🔵 ACTION PHYSICAL SCHEMA CONTRACT + LEGACY ACTION COMPATIBILITY RECONCILIATION**

Only after that gate should physical Action SQL be designed, and only after canonical Action persistence is settled should Payments migration design resume.
