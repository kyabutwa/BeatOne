# Fresh Event Persistence → Evidence Persistence Reconciliation

**Status:** 🟡 SUPPORTED — PHYSICAL RECONCILIATION COMPLETE; IMPLEMENTATION/MIGRATION GATE CLOSED
**Date:** 2026-10-02
**Repository:** `kyabutwa/BeatOne`
**Production database:** Neon `Zalagren` / `neonDB`

## 1. Purpose

This reconciliation establishes the current physical Event → Evidence boundary before any Event/Evidence schema implementation or production migration is authored.

No production schema mutation, migration, data write, provider integration, UI work, or GENESIS authority change is authorized by this document.

## 2. Current canonical application contracts

### Event

The canonical Event contract is already implemented and verified.

Canonical shape:

`id, actionId?, type, occurredAt, state, actorId?, contextId?, source, correlationId?, causationId?, version`

Required invariants include:
- non-empty id/type/source;
- valid occurrence timestamp;
- positive integer version;
- linked Action existence when actionId is supplied;
- Event state equals linked Action state;
- actor/context consistency with linked Action;
- Event does not grant authorization or independently prove real-world completion.

### Evidence

The canonical Evidence contract is already implemented and verified.

Canonical shape:

`id, eventId?, source, verification, recordedAt, externalReference?`

Verification states:
`UNVERIFIED | VERIFIED | REJECTED`

Required invariants include:
- non-empty id/source;
- valid recordedAt;
- canonical verification state;
- linked Event existence when eventId is supplied;
- provider/reference atomicity;
- provider/reference remain secondary identifiers.

## 3. DB-neutral persistence reconciliation

The existing DB-neutral persistence representation is aligned with the application contracts:

- `events` → StoredEvent
- `evidences` → StoredEvidence

StoredEvent already represents action linkage, lifecycle state, attribution, context, correlation/causation and version.

StoredEvidence already represents optional Event linkage, source, verification, recording time and external provider/reference.

Canonical separation remains explicit:
`Action ≠ Event ≠ Evidence`.

## 4. Fresh production physical inspection

Production was inspected read-only after the completed Action and Payments migrations.

### Event physical table

`public.events` exists with:

- `id text NOT NULL`
- `type text NOT NULL`
- `title text NOT NULL`
- `context_id text NOT NULL`
- `participant_id text NOT NULL`
- `actor_id text NULL`
- `authorization_id text NULL`
- `source text NULL`
- `status text NOT NULL`
- `occurred_at timestamptz NOT NULL`
- `metadata jsonb NULL`

Current physical Event constraints restrict:
- source to `participant | provider | device | system`;
- status to `open | pending | resolved`.

There are no physical foreign keys from `events` to the canonical Action, Identity, or Context records.

There is no physical `action_id`, `correlation_id`, `causation_id`, or `version` column.

### Evidence physical table

`public.evidence` exists with:

- `id text NOT NULL`
- `status text NOT NULL`
- `statement text NOT NULL`
- `source text NULL`
- `observed_at timestamptz NULL`

Current physical Evidence constraints restrict status to:
`verified | observed | inferred | hypothesis | demo`.

There is no physical `event_id` foreign key on `evidence`, and no physical provider/reference pair matching the canonical Evidence representation.

### Existing Event ↔ Evidence link

`public.event_evidence` exists and currently provides:

- `event_id text NOT NULL` → `events.id`
- `evidence_id text NOT NULL` → `evidence.id`
- primary key `(event_id, evidence_id)`

This is a separate many-to-many physical linkage, while the canonical Evidence contract models a single optional `eventId` on Evidence.

The table is currently empty.

## 5. Fresh production row state

Verified current counts:

- `events`: 0
- `evidence`: 0
- `event_evidence`: 0
- `actions`: 0
- `payments`: 0
- `action_outcome_trace`: 0
- `genesis_knowledge`: 0
- `genesis_intelligence`: 0

Therefore no existing Event/Evidence rows require transformation during a future canonicalization.

## 6. Reconciliation result

### Event

**Physical mismatch confirmed.**

The existing table is an older Event model and cannot be treated as the canonical physical representation without reconciliation.

The future physical Event target must preserve the canonical Event contract, including:
- Action linkage;
- lifecycle state;
- actor/context integrity;
- source;
- occurrence time;
- correlation/causation;
- positive version;
- appropriate foreign-key integrity.

Legacy fields such as `title`, `participant_id`, `authorization_id`, `status`, and `metadata` must not be silently assigned new meanings. Their disposition requires explicit schema reconciliation.

### Evidence

**Physical mismatch confirmed.**

The existing table is an older evidence/claim representation and does not directly implement the canonical Evidence contract.

The future physical Evidence target must preserve:
- canonical Evidence identity;
- optional Event linkage;
- source;
- verification state;
- recordedAt;
- provider/reference atomicity.

The existing `event_evidence` relation cannot be promoted to canonical Evidence identity. Its eventual disposition must be explicitly decided after dependency/data verification.

### Event ↔ Evidence boundary

The application contract is clear:

**Event records an occurrence. Evidence supports or qualifies a claim about an occurrence.**

Neither entity may be silently converted into the other.

## 7. Migration safety boundary

Because both physical tables are legacy-shaped but currently contain zero rows, the next implementation stage may use controlled canonicalization rather than data transformation, subject to a separately approved schema contract.

However, **no migration is authored or executed in this reconciliation**.

The required sequence remains:

**Fresh physical reconciliation → physical schema contract → application compatibility → deterministic tests → disposable PostgreSQL rehearsal → final reconciliation → production readiness → explicit production execution → post-migration verification.**

Historical migration SQL must not be fabricated.

## 8. Producer coverage that must be reconciled before implementation

Before physical migration, every canonical Event/Evidence producer must be checked for:

- Action → Event recording;
- Payment → Action/Event linkage;
- failure/denial/unknown outcomes;
- standalone Event creation where explicitly permitted;
- Event → Evidence creation;
- verification-state transitions;
- provider/reference handling;
- transaction atomicity;
- idempotency;
- version/concurrency;
- rollback behavior;
- GENESIS observation/proposal boundaries.

No producer may write directly around canonical authorization or persistence contracts.

## 9. GENESIS boundary

GENESIS remains an intelligence/proposal layer.

It may observe Events and Evidence and derive knowledge/insight according to its contract.

It must not:
- authorize an Event;
- fabricate an Event;
- fabricate Evidence;
- turn inference into verification;
- bypass Action/Authorization;
- silently convert external/provider outcomes into completed real-world truth.

## 10. Current gate

**🟡 SUPPORTED — EVENT PERSISTENCE → EVIDENCE PERSISTENCE PHYSICAL MISMATCH CONFIRMED.**

The canonical application/DB-neutral contracts are already present, but production physical Event and Evidence schemas are not yet canonical.

### Next exact controlled stage

**EVENT PHYSICAL SCHEMA CONTRACT → EVIDENCE PHYSICAL SCHEMA CONTRACT → PRODUCER COVERAGE RECONCILIATION**

Only after that stage passes should a physical migration design be considered.

