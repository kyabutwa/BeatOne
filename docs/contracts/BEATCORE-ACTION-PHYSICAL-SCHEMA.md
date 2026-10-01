# BeatCore Action Physical PostgreSQL Schema Contract

**Status:** APPROVED DESIGN CONTRACT — NO MIGRATION SQL  
**Scope:** Canonical Action physical persistence + legacy live Action compatibility  
**Production mutation:** NONE

## 1. Canonical target

The physical `public.actions` representation MUST support the frozen canonical Action:

| Column | PostgreSQL type | Nullability | Contract |
|---|---|---:|---|
| id | text | NO | PRIMARY KEY |
| actor_id | text | NO | FK → identities.id |
| proposal_id | text | YES | FK → proposals.id |
| authorization_id | text | NO | FK → authorizations.id |
| state | varchar(16) | NO | canonical LifecycleState only |
| operation | text | NO | non-blank |
| context_id | text | YES | FK → contexts.id |
| correlation_id | text | YES | non-blank when present |
| idempotency_key | text | YES | non-blank; canonical uniqueness scope |
| created_at | timestamptz | NO | creation time |
| updated_at | timestamptz | NO | >= created_at |
| version | bigint | NO | >= 1, monotonic |

The lifecycle set is exactly:
`REQUESTED, AUTHORIZED, PROCESSING, COMPLETED, DENIED, REJECTED, FAILED, EXPIRED, CANCELLED, PARTIAL, DISPUTED, REVERSED, RECONCILED`.

The database rejects invalid values but does not translate states. Application/domain code remains responsible for allowed state transitions.

## 2. Referential integrity

Required FKs:

- `actor_id → identities.id`;
- `proposal_id → proposals.id` when present;
- `authorization_id → authorizations.id`;
- `context_id → contexts.id` when present.

Canonical references use restrictive deletion unless a later contract explicitly changes this.

Application/domain validation MUST additionally preserve:

- Action actor = Authorization actor;
- Proposal actor = Action actor when Proposal is supplied;
- referenced records exist before consequential Action persistence.

A foreign key alone is not sufficient proof of actor/authorization semantic equality.

## 3. Idempotency and concurrency

If `idempotency_key` is present it must be non-blank. Database uniqueness MUST prevent conflicting reuse of the same canonical key under the final Action idempotency scope.

Updates MUST use monotonic `version` compare-and-swap (or an equivalent concurrency mechanism). A stale/equal version MUST NOT overwrite a newer committed Action. Timestamps alone are insufficient.

## 4. Live legacy reconciliation

Read-only inspection of the current Neon production branch found `public.actions` with **0 rows** and these legacy columns:

- `id text NOT NULL`;
- `participant_id text NOT NULL`;
- `context_id text NOT NULL`;
- `capability_id text NOT NULL`;
- `action text NOT NULL`;
- `created_at timestamptz NOT NULL DEFAULT now()`.

Existing constraints include:

- `participant_id → participants.id`;
- `context_id → contexts.id`;
- `capability_id → capabilities.id`;
- composite context/participant and capability/action relationships.

These fields are NOT safe aliases for canonical fields:

- `participant_id` ≠ `actor_id`;
- `capability_id` ≠ `authorization_id`;
- legacy `action` is not automatically canonical `operation`;
- legacy mandatory `context_id` does not make canonical context mandatory.

## 5. Compatibility decision

The initial migration strategy is **in-place canonicalization with temporary legacy compatibility**, not rename/drop/recreate.

Because the live Action table is empty, no row backfill is currently required. However, empty data does not remove schema dependencies.

The future migration MUST:

1. retain `public.actions` as the physical table identity initially;
2. retain its primary-key identity;
3. account for every FK referencing `actions.id`;
4. add/establish canonical Action fields and constraints;
5. establish canonical application writes before legacy cleanup;
6. retain legacy columns temporarily where dependency compatibility requires them;
7. prevent new canonical application logic from treating legacy columns as business truth;
8. remove legacy columns/constraints only in a separately approved cleanup migration after dependency verification.

No destructive operation is justified merely because the table has zero rows.

## 6. Live dependent discovered

Read-only inspection found:

`public.action_executions.action_id → public.actions.id`

and `action_executions` currently has **0 rows**.

`action_executions` is an execution-specific physical model, not canonical BeatCore Action. It must not be promoted into the Action entity or duplicated.

Its dependency on `actions.id` must remain valid throughout the Action migration. All live dependents must be re-queried immediately before migration execution.

## 7. Event/Evidence boundary

`events.action_id` remains the canonical Action relationship.

Events and Evidence remain separate canonical records. No duplicate `action_events`, `action_evidence`, or replacement Action-audit table is introduced.

## 8. Application compatibility

The application already represents canonical Action fields:

`actorId, proposalId, authorizationId, state, operation, contextId, correlationId, idempotencyKey`.

No frozen BeatCore contract change is required.

The application MUST NOT depend on the legacy physical fields `participant_id`, `capability_id`, or legacy `action`.

## 9. Migration-source governance

Before any migration SQL is authored:

- migrations must have one canonical committed repository directory;
- each migration needs a unique deterministic ID and reviewable SQL source;
- applied IDs must be registered in `public.zalagren_schema_migrations`;
- unrecovered historical migration SQL must never be fabricated;
- the migration must be tested against a disposable/non-production Neon branch cloned from the real production state;
- production application remains a separate explicit approval gate.

## 10. Required verification gates

Before migration design closes, prove:

- target Action schema matches this contract;
- every live FK into `actions` is accounted for;
- no repository/runtime path requires legacy columns;
- actor/authorization invariant is preserved;
- lifecycle constraint is exact;
- idempotency conflicts are deterministic;
- stale writes are rejected by version;
- Event/Evidence remain separate;
- `action_executions` remains compatible;
- existing application tests and CI are green.

## 11. Explicitly not executed

This stage does NOT:

- create migration SQL;
- execute or prepare migration SQL;
- ALTER/CREATE/DROP/RENAME any Neon production object;
- modify production data;
- modify Payments schema;
- finalize Payments migration;
- deploy production changes.

All Neon inspection for this reconciliation was read-only.

## 12. Gate

**🟢 VERIFIED — ACTION PHYSICAL SCHEMA CONTRACT + LEGACY ACTION COMPATIBILITY RECONCILIATION COMPLETE.**

Controlled sequence:

**Action physical schema → migration design → controlled non-production verification → Payments migration design → migration execution gate.**

Production migration SQL remains untouched.
