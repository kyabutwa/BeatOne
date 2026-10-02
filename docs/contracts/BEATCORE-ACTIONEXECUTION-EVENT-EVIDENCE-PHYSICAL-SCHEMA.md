# BeatCore ActionExecution → Event → Evidence Physical PostgreSQL Schema Contract

**Status:** APPROVED DESIGN CONTRACT — NO MIGRATION SQL  
**Scope:** Final canonical physical contract for ActionExecution → Event → Evidence and ActionOutcomeTrace  
**Production mutation:** NONE  
**Migration design:** BLOCKED until this contract is separately converted into a zero-data migration and rehearsed

## 1. Purpose and authoritative boundary

This document freezes the physical contract for the execution/outcome chain:

**Proposal → Authorization → Action → ActionExecution → Event → Evidence**

with the supporting trace:

**ActionExecution → ActionOutcomeTrace → Event + Evidence**

The canonical domain boundaries remain:

- **Action** is an authorized operation/request and lifecycle record.
- **ActionExecution** is an execution attempt/result record for an Action.
- **Event** records an occurrence produced by or associated with an Action.
- **Evidence** records information supporting or qualifying an Event.
- **ActionOutcomeTrace** is a supporting correlation record connecting one execution to its resulting Event and Evidence.

GENESIS remains outside this chain as intelligence/proposal infrastructure. It MUST NOT authorize, execute, fabricate Events, fabricate Evidence, or mark Evidence as verified.

No migration SQL is defined or executed by this contract.

## 2. Canonical physical topology

The final physical topology is:

    Proposal
        ↓
    Authorization
        ↓
    Action
        ↓
    ActionExecution
        ↓
    Event
        ↓
    Evidence

Supporting outcome trace:

    ActionExecution
        ├── Event
        └── Evidence

The direct Event → Evidence relationship is represented by nullable `evidence.event_id`, not by a separate many-to-many bridge.

Therefore:

- one Action MAY have zero or more ActionExecutions;
- one ActionExecution MUST belong to exactly one Action;
- one ActionExecution MAY produce zero or one canonical outcome Event through ActionOutcomeTrace;
- one Event MAY have zero or more Evidence records;
- one Evidence MAY optionally belong to one Event;
- one ActionOutcomeTrace MUST identify exactly one ActionExecution, one Event, and one Evidence.

The trace is not an alternative Event/Evidence model.

## 3. Canonical Action boundary

The Action contract remains the previously approved canonical contract:

| Column | PostgreSQL rule |
|---|---|
| id | text NOT NULL, PRIMARY KEY |
| actor_id | text NOT NULL, FK → identities.id |
| proposal_id | text NULL, FK → proposals.id |
| authorization_id | text NOT NULL, FK → authorizations.id |
| state | canonical LifecycleState, NOT NULL |
| operation | text NOT NULL, non-blank |
| context_id | text NULL, FK → contexts.id |
| correlation_id | text NULL, non-blank when present |
| idempotency_key | text NULL, non-blank when present |
| created_at | timestamptz NOT NULL |
| updated_at | timestamptz NOT NULL, >= created_at |
| version | bigint NOT NULL, >= 1 |

Canonical lifecycle values are exactly:

`REQUESTED, AUTHORIZED, PROCESSING, COMPLETED, DENIED, REJECTED, FAILED, EXPIRED, CANCELLED, PARTIAL, DISPUTED, REVERSED, RECONCILED`.

The existing Action legacy columns are not part of canonical business truth.

## 4. ActionExecution physical contract

The existing `public.action_executions` table is confirmed as a legitimate separate execution layer.

Final target:

| Column | PostgreSQL rule | Meaning |
|---|---|---|
| id | text NOT NULL, PRIMARY KEY | execution identity |
| action_id | text NOT NULL, FK → actions.id | owning Action |
| proposal_id | text NOT NULL, FK → proposals.id | execution's proposal context |
| authorization_id | text NOT NULL, FK → authorizations.id | authorization used for execution |
| status | text NOT NULL | `started | succeeded | failed | cancelled` |
| provider_reference | text NULL | external execution/provider identifier |
| started_at | timestamptz NOT NULL | execution start |
| finished_at | timestamptz NULL | completion time |
| result | jsonb NULL | provider/execution result payload |
| idempotency_key | text NOT NULL, UNIQUE | execution idempotency key |

Required physical invariants:

1. `action_id` MUST reference an existing Action.
2. `proposal_id` MUST reference an existing Proposal.
3. `authorization_id` MUST reference an existing Authorization.
4. `status` MUST be exactly one of `started, succeeded, failed, cancelled`.
5. `started` requires `finished_at IS NULL`.
6. `succeeded`, `failed`, and `cancelled` require `finished_at IS NOT NULL`.
7. `idempotency_key` MUST be non-null and unique.
8. The execution MUST NOT become an alternate Action identity or authorization source.

Application invariants additionally required:

- `ActionExecution.action_id` identifies the Action being executed.
- `ActionExecution.authorization_id` MUST be the authorization used by that Action.
- The execution MUST NOT authorize an Action independently.
- Execution status is execution status, not Action lifecycle state.

No new ActionExecution table is required; the existing table is canonicalized in place.

## 5. Event physical contract

Final target table identity is the canonical `public.events`.

| Column | PostgreSQL rule | Meaning |
|---|---|---|
| id | text NOT NULL, PRIMARY KEY | Event identity |
| action_id | text NULL, FK → actions.id | originating/associated Action |
| type | text NOT NULL, non-blank | Event type |
| occurred_at | timestamptz NOT NULL | occurrence time |
| state | lifecycle state NOT NULL | Event state |
| actor_id | text NULL, FK → identities.id | actor attribution |
| context_id | text NULL, FK → contexts.id | contextual attribution |
| source | text NOT NULL, non-blank | source category |
| correlation_id | text NULL | correlation identifier |
| causation_id | text NULL | causation identifier |
| version | bigint NOT NULL, >= 1 | Event version |

Required physical invariants:

1. `id` is unique.
2. `type` and `source` are non-blank.
3. `occurred_at` is valid and NOT NULL.
4. `state` uses the canonical LifecycleState set.
5. `version >= 1`.
6. If `action_id` is present, the Action MUST exist.
7. If `actor_id` is present, the Identity MUST exist.
8. If `context_id` is present, the Context MUST exist.
9. Event persistence MUST NOT grant authorization.
10. Event persistence MUST NOT independently prove real-world completion.

Application invariants:

- If `action_id` is present, Event.state MUST equal the linked Action.state at creation.
- If `actor_id` is present, it MUST equal the linked Action.actor_id.
- If `context_id` is present, it MUST equal the linked Action.context_id.
- Event version updates MUST use the same strict compare-and-swap semantics already verified for Event persistence.
- Event state is descriptive of the recorded occurrence; it does not authorize or execute an Action.

## 6. Evidence physical contract

The final canonical physical table is **`public.evidences`** (plural), matching the repository persistence contract.

| Column | PostgreSQL rule | Meaning |
|---|---|---|
| id | text NOT NULL, PRIMARY KEY | Evidence identity |
| event_id | text NULL, FK → events.id | optional Event supported/qualified |
| source | text NOT NULL, non-blank | evidence source |
| verification | text NOT NULL | `UNVERIFIED | VERIFIED | REJECTED` |
| recorded_at | timestamptz NOT NULL | time Evidence was recorded |
| external_provider | text NULL | external provider name |
| external_reference | text NULL | external provider reference |

Required physical invariants:

1. `id` is unique.
2. `source` is non-blank.
3. `verification` is exactly `UNVERIFIED`, `VERIFIED`, or `REJECTED`.
4. `recorded_at` is NOT NULL.
5. If `event_id` is present, the Event MUST exist.
6. `external_provider` and `external_reference` are atomic: either both are NULL or both are non-blank.
7. Evidence verification is an explicit state; storage MUST NOT silently upgrade an Evidence record to VERIFIED.
8. Evidence does not grant authorization and does not execute an Action.

Application invariants:

- An Evidence record may be created without an Event.
- When `event_id` is supplied, it must reference the Event being supported or qualified.
- Verification transitions MUST remain governed by the Evidence domain contract.
- External references remain secondary identifiers and never replace the Evidence primary identity.

## 7. ActionOutcomeTrace physical contract

`public.action_outcome_trace` remains a supporting relation.

| Column | PostgreSQL rule | Meaning |
|---|---|---|
| execution_id | text NOT NULL, PRIMARY KEY, FK → action_executions.id | execution being traced |
| event_id | text NOT NULL, FK → events.id | resulting/associated Event |
| evidence_id | text NOT NULL, FK → evidences.id | supporting Evidence |
| created_at | timestamptz NOT NULL, default now() | trace creation time |

Required physical invariants:

1. One `execution_id` has at most one outcome trace.
2. `execution_id`, `event_id`, and `evidence_id` must all reference existing records.
3. `(event_id, evidence_id)` is unique.
4. The trace MUST NOT create a second Event or Evidence identity.
5. The trace MUST NOT authorize or execute an Action.
6. A trace may only be created for a completed/persisted execution outcome according to the application execution contract.

Cross-entity semantic invariants, to be enforced by application/domain logic unless a later physical mechanism is explicitly proven:

- `action_outcome_trace.execution_id` → ActionExecution.action_id → Action.id.
- `action_outcome_trace.event_id` MUST identify an Event whose `action_id` is the same Action as the traced ActionExecution.
- `action_outcome_trace.evidence_id` MUST identify Evidence whose `event_id` is the traced Event when the Evidence has an Event association.
- The trace MUST NOT connect an execution to an unrelated Event or Evidence.
- A trace is evidence of correlation, not evidence verification by itself.

## 8. Legacy Action disposition

The current production Action table has zero rows and contains legacy fields.

| Legacy field | Final disposition | Reason |
|---|---|---|
| participant_id | TEMPORARY COMPATIBILITY ONLY → remove in later cleanup | Not equivalent to actor_id; no canonical business meaning |
| capability_id | REMOVE | Authorization is the canonical authority relationship; capability is represented through Authorization |
| action | REMOVE | Not equivalent to canonical operation without an unsafe semantic mapping |
| context_id | RETAIN/CANONICALIZE | Same field exists in canonical Action, but final nullability is optional |
| created_at | RETAIN/CANONICAL | Canonical Action field |
| actor_id | RETAIN/CANONICAL | Canonical Action field |
| proposal_id | RETAIN/CANONICAL | Canonical Action field |
| authorization_id | RETAIN/CANONICAL | Canonical Action field |
| state | RETAIN/CANONICAL | Canonical Action lifecycle |
| operation | RETAIN/CANONICAL | Canonical Action operation |
| correlation_id | RETAIN/CANONICAL | Canonical correlation |
| idempotency_key | RETAIN/CANONICAL | Canonical idempotency |
| updated_at | RETAIN/CANONICAL | Canonical concurrency/update timestamp |
| version | RETAIN/CANONICAL | Canonical optimistic concurrency |

The initial Action canonicalization MUST NOT map `participant_id`, `capability_id`, or `action` into canonical fields.

## 9. Legacy Event disposition

Current production `events` has zero rows.

| Legacy field | Final disposition | Reason |
|---|---|---|
| id | RETAIN | Canonical identity |
| type | RETAIN | Canonical Event type |
| title | REMOVE | No canonical Event field; no safe semantic alias |
| context_id | RETAIN/CANONICALIZE as nullable | Canonical optional context |
| participant_id | REMOVE | Participant is not canonical Event attribution |
| actor_id | RETAIN/CANONICALIZE as nullable | Canonical optional actor |
| authorization_id | REMOVE | Authorization belongs to Action/authorization boundary, not Event identity |
| source | RETAIN/CANONICALIZE as required non-blank | Canonical source |
| status | REPLACE with canonical state | Legacy `open/pending/resolved` is not the canonical lifecycle contract |
| occurred_at | RETAIN | Canonical occurrence time |
| metadata | REMOVE | No canonical persistence field; no silent reassignment of opaque data |

No legacy Event field may be silently repurposed.

## 10. Legacy Evidence disposition

Current production `evidence` has zero rows.

| Legacy field/table | Final disposition | Reason |
|---|---|---|
| table `evidence` | RENAME/CANONICALIZE to `evidences` | Repository physical contract is plural |
| id | RETAIN | Canonical identity |
| status | REPLACE with `verification` | Legacy states do not map one-to-one to canonical verification |
| statement | REMOVE | No canonical Evidence statement field; no safe semantic destination |
| source | RETAIN/CANONICAL | Canonical source |
| observed_at | REMOVE | Not semantically identical to canonical recorded_at |
| event_id | ADD | Canonical optional Event relationship |
| recorded_at | ADD | Canonical recording timestamp |
| external_provider | ADD | Canonical external provider |
| external_reference | ADD | Canonical external reference |

Because the table is empty, no status/statement/observed_at transformation is permitted or necessary.

## 11. Legacy event_evidence bridge disposition

Current `public.event_evidence` is a many-to-many bridge and is empty.

Final disposition:

**REMOVE after dependency verification in the migration rehearsal.**

Reason:

- canonical Evidence has one optional `event_id`;
- the bridge introduces a second relationship model;
- retaining both would create competing Event ↔ Evidence truth;
- `action_outcome_trace` remains the separate execution-outcome correlation layer.

The bridge MUST NOT be deleted until the migration preflight verifies:

1. row count is zero, or an explicitly approved transformation exists;
2. no foreign keys reference `event_evidence`;
3. no repository/runtime code depends on the table;
4. no external integration depends on the table;
5. the canonical `evidences.event_id` relationship is available.

No data mapping from many-to-many to `evidences.event_id` may be invented if rows ever appear. Non-zero rows block the zero-data migration.

## 12. Cross-chain invariants

The following invariants are authoritative:

### I1 — Authorization authority

`Action.authorization_id` identifies the Authorization used by the Action.

`Action.actor_id = Authorization.actor_id`.

Neither Participant nor Capability may substitute for Authorization.

### I2 — Execution ownership

Every ActionExecution belongs to exactly one Action:

`ActionExecution.action_id → Action.id`.

ActionExecution does not become a second Action.

### I3 — Execution authorization continuity

`ActionExecution.authorization_id` must identify the Authorization used by the owning Action.

The execution layer MUST NOT silently switch authority.

### I4 — Event causality

When an Event is Action-linked:

`Event.action_id → Action.id`.

The Event records an occurrence associated with that Action; it does not create or authorize the Action.

### I5 — Event state consistency

For Action-linked Event creation:

`Event.state = Action.state`.

### I6 — Evidence support

When Evidence is Event-linked:

`Evidence.event_id → Event.id`.

Evidence qualifies/supports the Event; it does not become the Event.

### I7 — Outcome trace coherence

For each ActionOutcomeTrace:

`execution_id → ActionExecution → Action`

and

`event_id → Event → Action`

must resolve to the same Action.

When `evidence.event_id` is non-null, it must equal the trace's `event_id`.

### I8 — No authority leakage

Event, Evidence, and ActionOutcomeTrace MUST NOT grant authorization, alter Authorization decisions, or independently create execution authority.

### I9 — No fabricated verification

GENESIS or other intelligence/proposal layers MUST NOT mark Evidence VERIFIED merely by generating a proposal or inference.

### I10 — Identity and immutability

Each layer retains its own identity. No layer may use another layer's primary key as its own identity.

## 13. Physical-vs-application enforcement boundary

Database constraints MUST enforce where the relationship can be represented safely:

- primary keys;
- foreign keys;
- non-null requirements;
- canonical enum/state checks;
- non-blank checks;
- unique idempotency keys;
- version lower bounds;
- atomic external-reference presence.

Application/domain logic MUST enforce semantic relationships that require comparing values across records unless a later database mechanism is explicitly designed and verified:

- Action.actorId = Authorization.actorId;
- ActionExecution.authorization continuity;
- Event.state = Action.state;
- Event.actor/context consistency with Action;
- ActionExecution/Event same-Action coherence;
- ActionOutcomeTrace Event/Evidence coherence;
- legal lifecycle transitions;
- Evidence verification transitions.

A foreign key alone is not treated as proof of semantic correctness.

## 14. Zero-data migration preconditions

The eventual migration may be a zero-data canonicalization only if the production preflight immediately before rehearsal/execution proves:

- actions = 0;
- action_executions = 0;
- events = 0;
- evidence = 0;
- event_evidence = 0;
- action_outcome_trace = 0;
- migration ID unused;
- every FK referencing Actions, Events, Evidence, and the legacy bridge has been enumerated;
- no unexpected repository/runtime dependency exists;
- required parent tables exist;
- the provider authentication boundary remains untouched.

If any affected table contains rows, the zero-data migration is blocked.

## 15. Required verification sequence before migration design

The next implementation stage is strictly:

1. Freeze this physical contract.
2. Reconcile repository/runtime references against the final dispositions.
3. Re-read the live production dependency graph immediately before migration authoring.
4. Design one deterministic zero-data migration source under `migrations/`.
5. Rehearse the exact committed source on a disposable Neon branch cloned from current production.
6. Verify schema, constraints, dependency graph, runtime persistence, cross-chain invariants, rollback, and ledger behavior.
7. Only then open a separate production execution gate.

No production Event/Evidence mutation is authorized by this contract.

## 16. Current evidence state

At the time this contract was produced, the production physical state is:

- `actions`: 0 rows
- `action_executions`: 0 rows
- `events`: 0 rows
- `evidence`: 0 rows
- `event_evidence`: 0 rows
- `action_outcome_trace`: 0 rows

The current ActionExecution/Event/Evidence physical mismatch is therefore a schema-contract problem, not a data-transformation problem.

## 17. Gate

**🟢 VERIFIED — FINAL ACTIONEXECUTION → EVENT → EVIDENCE PHYSICAL CONTRACT PRODUCED.**

**🔵 MIGRATION DESIGN — NOT YET AUTHORED.**

**🔴 PRODUCTION EVENT/EVIDENCE MIGRATION — CLOSED.**

This contract is the sole design basis for the next zero-data migration reconciliation.