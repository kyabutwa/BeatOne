# Action Physical Migration Design + Migration-Source Implementation Governance

**Status:** 🔵 PROPOSED — REVIEWABLE MIGRATION DESIGN; NO MIGRATION SQL EXECUTED  
**Scope:** Current live `public.actions` table and its physical dependencies only  
**Production mutation:** NONE  
**Payments migration:** NOT INCLUDED  
**Migration identifier:** NOT assigned or registered

## 1. Purpose and boundary

This document is the controlled bridge from the approved canonical Action physical schema contract to a future PostgreSQL migration.

It defines **what a future migration must do, in what order, what it must preserve, how it must be verified, and how its source must be governed**.

It intentionally does **not** contain executable migration SQL and does not authorize production database mutation.

In scope:

- live `public.actions`;
- all currently known foreign-key dependencies into `actions.id`;
- compatibility with canonical Action persistence;
- legacy-column disposition;
- constraints, indexes, idempotency and concurrency requirements;
- migration-source location and registration governance;
- disposable/non-production verification requirements.

Out of scope:

- Payments migration;
- `payment_intents` / `payment_events` transformation;
- provider integration;
- GENESIS;
- UI;
- deployment;
- production execution.

## 2. Authoritative inputs

The migration design is bounded by these already-reconciled facts:

1. The canonical BeatCore Action contract is frozen.
2. The approved physical Action schema contract defines the target physical representation.
3. Live PostgreSQL `public.actions` is a legacy representation.
4. Live `public.actions` currently contains **0 rows**.
5. Live `public.action_executions.action_id` references `public.actions.id` and currently has **0 rows**.
6. Events remain separate canonical records and use `events.action_id`.
7. Historical migration SQL for the applied 016–022 ledger entries is not recoverable from the repository inspected so far and must not be fabricated.
8. The live migration ledger is `public.zalagren_schema_migrations`.
9. Migration 023 is not assigned and must not be retroactively invented.

## 3. Target physical Action

The future physical `public.actions` representation must contain the canonical fields established by the physical schema contract:

| Field | Required physical rule |
|---|---|
| `id` | text primary key; preserve existing Action identity |
| `actor_id` | text NOT NULL; FK to `identities.id` |
| `proposal_id` | text nullable; FK to `proposals.id` |
| `authorization_id` | text NOT NULL; FK to `authorizations.id` |
| `state` | canonical LifecycleState only |
| `operation` | text NOT NULL and non-blank |
| `context_id` | text nullable; FK to `contexts.id` |
| `correlation_id` | text nullable; non-blank when present |
| `idempotency_key` | text nullable; non-blank when present; canonical uniqueness |
| `created_at` | timestamptz NOT NULL |
| `updated_at` | timestamptz NOT NULL and >= `created_at` |
| `version` | bigint NOT NULL, >= 1, monotonic |

The lifecycle constraint is exactly:

`REQUESTED, AUTHORIZED, PROCESSING, COMPLETED, DENIED, REJECTED, FAILED, EXPIRED, CANCELLED, PARTIAL, DISPUTED, REVERSED, RECONCILED`.

The database validates representation and referential integrity; application/domain logic remains responsible for legal lifecycle transitions and authorization semantics.

## 4. Live legacy state to transform

The currently observed legacy columns are:

- `id text NOT NULL`;
- `participant_id text NOT NULL`;
- `context_id text NOT NULL`;
- `capability_id text NOT NULL`;
- `action text NOT NULL`;
- `created_at timestamptz NOT NULL DEFAULT now()`.

The legacy relationships include:

- `participant_id → participants.id`;
- `context_id → contexts.id`;
- `capability_id → capabilities.id`;
- composite context/participant and capability/action relationships.

These are **not semantic aliases** for the canonical model.

Therefore the migration MUST NOT perform any automatic mapping such as:

- `participant_id → actor_id`;
- `capability_id → authorization_id`;
- legacy `action → operation`;
- legacy mandatory `context_id` → canonical mandatory context.

Because the live table has zero rows, the migration has no current row data to backfill. This is a verification fact, not permission to discard dependencies.

## 5. Compatibility strategy

The approved strategy is:

**In-place canonicalization with temporary legacy compatibility.**

The future migration must:

1. keep `public.actions` as the table identity;
2. keep `actions.id` as the primary identity;
3. preserve all live FK dependencies into `actions.id`;
4. add/establish canonical columns and constraints;
5. avoid destructive rename/drop/recreate operations in the initial migration;
6. retain legacy columns temporarily if required by compatibility or dependency analysis;
7. ensure canonical application code does not use legacy columns as business truth;
8. remove legacy columns and legacy-only constraints only through a later, separately reviewed cleanup migration after dependency verification.

A future migration may leave unused legacy columns temporarily. That is deliberate compatibility, not dual canonical truth.

## 6. Dependency preservation

### 6.1 `action_executions`

Known live dependency:

`public.action_executions.action_id → public.actions.id`.

The migration must preserve this relationship continuously.

Before execution, the verification procedure must re-query:

- every foreign key whose referenced table is `public.actions`;
- row counts for every such dependent table;
- constraint definitions;
- indexes and application references.

If additional dependencies are discovered, migration execution is blocked until they are explicitly incorporated into the design.

No dependency may be silently dropped merely because its current table contains zero rows.

### 6.2 Events and Evidence

Canonical `events` and `evidence` remain separate entities.

The migration must not:

- copy Events into Actions;
- create Action-specific Event/Evidence tables;
- reinterpret legacy `actions.action` as an Event;
- replace the canonical `events.action_id` relationship.

The canonical trace remains:

**Authorization → Action → Event → Evidence**.

## 7. Authorization and identity integrity

The physical migration establishes:

- `actions.actor_id → identities.id`;
- `actions.authorization_id → authorizations.id`.

The database foreign keys prove existence, but not actor equality.

The post-migration application contract must therefore enforce:

**Action.actorId = Authorization.actorId**

and must use the persisted Authorization as the authority source.

If proposal linkage is present, the application must also preserve the canonical Proposal/Action actor invariant.

No migration may weaken authorization by substituting participant or capability references for the canonical Authorization.

## 8. Lifecycle and state initialization

Because the live Action table is empty, no historical Action state requires conversion.

Future canonical Action creation must initialize state through the application contract, normally beginning at the contractually permitted authorized/request state rather than by arbitrary SQL defaults.

The migration must not invent a lifecycle state for nonexistent historical rows.

Database constraints must reject values outside the canonical lifecycle set.

## 9. Idempotency

The future physical schema must support the canonical Action idempotency contract.

Rules:

- an absent `idempotency_key` remains distinguishable from a supplied key;
- a supplied key must be non-blank;
- conflicting reuse of a canonical key must be rejected deterministically;
- uniqueness scope must be identical between application and database enforcement;
- the migration must not introduce a weaker database constraint than the application contract.

Before execution, the final idempotency scope must be explicitly recorded in the physical implementation contract. If the scope is not proven, the migration remains blocked.

## 10. Concurrency

The target schema includes a monotonic `version`.

The migration design therefore requires:

1. initial canonical rows to have a valid version of at least 1;
2. canonical updates to use compare-and-swap or an equivalent database concurrency mechanism;
3. stale/equal-version writes to be rejected rather than silently overwriting a newer committed Action;
4. timestamps not to be treated as the sole concurrency mechanism.

The migration itself must not fabricate concurrent updates. Concurrency behavior must be proven in the non-production verification stage.

## 11. Migration transformation sequence

The future migration implementation should follow this logical sequence, expressed here without executable SQL:

### Phase A — preflight

- verify the migration source ID is unused;
- verify the target database is the expected environment;
- re-read the current `actions` schema;
- enumerate all FKs referencing `actions.id`;
- enumerate indexes and constraints on `actions`;
- verify row counts;
- verify no unexpected legacy consumers;
- verify required target parent tables exist.

**Failure rule:** any unexpected schema, dependency, row, or migration-ledger state blocks execution.

### Phase B — compatibility preparation

- preserve `public.actions` and its primary-key identity;
- preserve or temporarily retain legacy columns/constraints where needed for safe transition;
- prepare canonical columns without assigning unsafe legacy aliases;
- establish the required parent-table references.

### Phase C — canonical constraint establishment

Establish and verify:

- primary key;
- canonical foreign keys;
- exact lifecycle constraint;
- non-null requirements;
- non-blank text requirements where applicable;
- provider-independent idempotency uniqueness;
- timestamp consistency;
- version lower bound and concurrency support.

### Phase D — application compatibility gate

Before treating the migration as complete:

- canonical Action reads/writes must use canonical columns;
- legacy columns must not be required by runtime business logic;
- Action persistence tests must exercise the physical contract;
- `action_executions` must continue to resolve `actions.id`;
- Events/Evidence must remain separate.

### Phase E — legacy retention

Legacy columns remain physically present during the initial canonicalization unless a dependency review proves they can safely be removed within the same approved change.

No legacy field is allowed to remain a second source of canonical truth.

### Phase F — post-migration verification

Verify the complete physical contract and dependency graph before the migration is considered successful.

## 12. Transaction and failure behavior

The future migration must be designed as an atomic schema transition wherever PostgreSQL permits.

Required properties:

- no partially canonicalized `actions` table may be accepted as successful;
- constraint creation failures must fail the migration;
- unexpected data/dependency findings must stop the migration;
- the migration ledger entry is recorded only after the migration has successfully completed according to the repository's migration runner semantics;
- a failed migration must not be marked as applied.

Because the historical 016–022 SQL source is not available, the migration must not assume rollback scripts for those historical changes. Recovery must instead be based on the new migration's own transactional behavior and a disposable-branch rehearsal.

## 13. Migration-source implementation governance

The repository currently has no authoritative committed SQL source for the already-applied historical migration IDs inspected in Neon.

Therefore future migrations must establish one canonical source of truth.

### Canonical source location

Future migration SQL SHALL live under:

`migrations/`

Each migration shall have:

- one deterministic migration identifier;
- one committed source artifact;
- reviewable Git history;
- no duplicate identifier;
- explicit ordering/dependency metadata where the migration mechanism requires it.

The initial Action migration identifier remains **unassigned** until the migration source is actually authored and the live ledger is rechecked.

It must **not** be called `023` merely because 022 is the latest observed applied identifier.

### Applied-state registration

When a future migration is legitimately executed, its identifier must be registered in:

`public.zalagren_schema_migrations`.

The source artifact and ledger identifier must match exactly.

The ledger is evidence of applied state. It is not a substitute for missing historical SQL source.

### Historical migrations

For 016–022:

- retain their live ledger records as applied-state evidence;
- do not reconstruct or fabricate SQL from inference;
- do not reuse their identifiers;
- do not rewrite their history into the new migration directory unless authoritative source is actually recovered.

## 14. Controlled non-production verification

Production execution is blocked until the migration has been rehearsed against a disposable Neon branch cloned from the relevant production state.

Verification must include:

### Schema

- target columns and types;
- nullability;
- primary key;
- all target FKs;
- lifecycle constraint;
- idempotency uniqueness;
- version/concurrency support;
- indexes.

### Dependency graph

- every FK into `actions.id`;
- `action_executions.action_id`;
- `events.action_id`;
- any newly discovered runtime/schema dependency.

### Data

- current zero-row expectation is rechecked;
- no unexpected rows appear between design and rehearsal;
- if rows exist, the migration is halted rather than inventing a transformation.

### Behavior

- canonical Action creation;
- actor/authorization mismatch rejection;
- missing Authorization rejection;
- lifecycle validation;
- idempotency conflict;
- stale-version rejection;
- Action/Event/Evidence separation;
- `action_executions` compatibility.

### Recovery

- migration failure behavior;
- transaction rollback/atomicity;
- ledger behavior on failure;
- repeatability/idempotency of the migration runner.

Only a successful disposable-branch rehearsal opens the next gate.

## 15. Production execution gate

The production gate remains closed until all of the following are green:

- 🔵 migration design reviewed and approved;
- 🔵 canonical migration source committed;
- 🔵 migration identifier verified unused;
- 🔵 live dependency graph rechecked;
- 🔵 non-production Neon rehearsal successful;
- 🔵 application/runtime compatibility verified;
- 🔵 recovery behavior verified;
- 🔵 CI green on the exact migration source;
- 🔵 explicit production execution authorization.

No production SQL is authorized by this document.

## 16. Sequence after this design

The controlled sequence is:

**Action migration design**  
→ **migration source implementation**  
→ **CI/review**  
→ **disposable Neon branch rehearsal**  
→ **Action physical migration verified**  
→ **Payments migration design**  
→ **Payments non-production verification**  
→ **explicit production execution gate**

Payments must not bypass the Action dependency by creating a parallel Action representation.

## 17. Final gate

**🔵 PROPOSED — ACTION MIGRATION DESIGN + MIGRATION-SOURCE IMPLEMENTATION GOVERNANCE COMPLETE.**

This document is the reviewable bridge from the approved Action physical schema to future migration implementation.

**No migration SQL was created.**  
**No Neon production object was altered.**  
**No production data was changed.**  
**No Payments migration was executed or designed beyond its dependency on canonical Action.**
