# BeatOne — Payments Physical Persistence Schema Reconciliation v1.0

**Status:** FRESH RECONCILIATION COMPLETE — PHYSICAL SCHEMA CONTRACT NOT YET IMPLEMENTED  
**Scope:** Resolve the physical Payments persistence boundary before any SQL, migration, Neon mutation, or production adapter work.  
**Authority:** Frozen BeatCore contracts → canonical Payments contract → canonical Payments persistence contract → current verified repository implementation.

## 1. Purpose

This reconciliation resolves the two open architectural questions identified during the full-system review and translates the already-verified DB-neutral Payments representation into a precise physical-schema direction.

It does **not** execute SQL, create a migration, connect to Neon, add a provider, change deployment, or alter foundational BeatCore semantics.

## 2. Verified baseline

The following remain protected and unchanged:

- BeatCore foundation and its frozen semantic ownership.
- Identity → Participant → Context → Capability → Authorization boundaries.
- canonical Action, Event, and Evidence semantics.
- GENESIS non-authoritative boundary.
- Higher Domain boundary.
- Payments domain contract.
- DB-neutral Payments persistence representation.
- deterministic Payments persistence tests and CI verification.
- stale-write protection in the DB-neutral repository.

The physical layer must implement these contracts rather than redefine them.

## 3. EntityType reconciliation

### Decision: payment remains outside foundational EntityType.

The current foundational EntityType contains canonical BeatCore entities and intentionally does not contain payment.

This is correct because the frozen BeatCore contract explicitly states that detailed Payments semantics are owned by the Payments higher domain.

Adding payment to src/beatcore.ts merely because a physical payments table exists would incorrectly promote a higher-domain entity into the foundational semantic registry.

Therefore:

**No EntityType change is authorized by this reconciliation.**

Payments remains a domain-owned entity with its own canonical Payment / StoredPayment representation.

If a future cross-domain API needs a universal entity-reference vocabulary that includes higher-domain entities, that must be introduced through a separate versioned contract rather than expanding BeatCore opportunistically.

## 4. Payment → Action reconciliation

### Decision: Action remains a canonical BeatCore record; Payment does not become an Action.

A consequential payment operation requires a canonical Action under the existing authorization boundary.

The relationship is:

Payment authorization → canonical Action → external processing → canonical Event → Evidence

The current Payment implementation deliberately does not invent an Action field. The existing Action model already owns action identity, actor, authorization basis, operation, lifecycle state, and correlation/idempotency metadata.

The existing Event model already links to Action.

However, physical persistence requires deterministic referential traceability when a Payment and its consequential Action are both persisted. A correlation identifier alone is not sufficient database referential integrity.

### Resolved contract direction

The Payments domain contract should gain an **optional actionId reference on Payment**, pointing to canonical actions.id, before the physical schema is finalized.

This does **not** make Action a Payments-owned entity, does not add a second Action model, and does not change BeatCore Action semantics.

Rules:

1. actionId is optional for non-consequential/request-level Payment records where no Action exists yet.
2. A consequential Payment that has entered its authorized execution path must carry the canonical Action reference.
3. The referenced Action must exist in the same local transaction when the Payment reference is persisted.
4. The referenced Action remains owned by BeatCore.
5. Payment state remains owned by Payments; Action lifecycle remains owned by BeatCore.
6. Payment completion is never inferred merely from Action state.
7. Event remains separate and continues to reference Action.
8. Evidence remains separate and continues to substantiate recognized occurrences.
9. No payment_action duplicate entity/table is introduced.
10. No modification to foundational EntityType is required.

This is a **contract/application-layer correction that must precede physical implementation**, not a reason to patch the foundation.

## 5. Physical table decision

A dedicated canonical payments table is required.

The table must not reuse actions as Payment truth and must not create parallel Payment Event or Payment Evidence tables.

Proposed canonical columns after the actionId contract correction:

| Column | Physical direction | Rule |
|---|---|---|
| id | text primary key | opaque BeatOne Payment ID |
| payer_participant_id | text nullable FK | canonical Participant |
| payee_participant_id | text nullable FK | canonical Participant |
| amount | numeric without forced scale | exact decimal representation; no floating point |
| currency | char(3) or equivalent constrained text | uppercase 3-letter code |
| purpose | text | required |
| status | constrained text | preserve every PaymentStatus |
| actor_id | text FK | canonical Identity |
| authorization_id | text FK | canonical Authorization |
| action_id | text nullable FK | canonical Action; required once consequential execution is represented |
| idempotency_key | text | required; exact uniqueness scope still to be finalized |
| request_id | text nullable | traceability only |
| correlation_id | text nullable | traceability only |
| causation_id | text nullable | traceability only |
| external_provider | text nullable | must pair with external reference |
| external_reference | text nullable | must pair with provider |
| created_at | timestamptz | canonical creation time |
| updated_at | timestamptz | canonical update time |

numeric is preferred over floating-point storage. No scale should be imposed until Payments defines currency-specific precision rules; otherwise the database could silently reject, round, or truncate valid domain values.

## 6. Referential integrity

The physical design must use foreign keys for canonical references where the database boundary is authoritative:

- payer_participant_id → participants.id
- payee_participant_id → participants.id
- actor_id → identities.id
- authorization_id → authorizations.id
- action_id → actions.id

The schema must not manufacture missing canonical records.

The actor/authorization invariant remains:

payment.actor_id = authorization.actor_id

A database foreign key alone cannot enforce this cross-row semantic equality. The application/domain transaction and, where appropriate, a database mechanism must enforce it without duplicating authorization semantics.

## 7. PaymentStatus representation

PaymentStatus remains a Payments-domain state and must not be collapsed into BeatCore LifecycleState.

The physical representation must preserve:

REQUESTED, AUTHORIZED, PROCESSING, PENDING, COMPLETED, FAILED, DENIED, REJECTED, CANCELLED, PARTIAL, UNKNOWN, REVERSED, RECONCILIATION_REQUIRED, RECONCILED

Unknown and reconciliation-required states must remain representable.

## 8. Idempotency

Payment idempotency must be enforced at the physical database boundary.

The remaining design decision is the exact business scope of idempotency_key (for example, per payment operation namespace rather than an accidental global rule).

Before migration implementation, this scope must be explicitly fixed and represented by a unique constraint/index that cannot permit conflicting consequential reuse.

Action idempotency remains a separate invariant. The two mechanisms must not be silently substituted for one another.

## 9. Provider-reference atomicity

external_provider and external_reference are an atomic pair:

- both NULL, or
- both populated.

No provider-specific column may be added to canonical Payment semantics without a separate contract decision.

Provider acknowledgement remains distinct from payment completion.

## 10. Concurrency

The in-memory repository currently rejects stale Payment replacements using updatedAt.

That is not sufficient as the final PostgreSQL concurrency mechanism because timestamp comparison alone does not establish a safe compare-and-swap boundary under concurrent transactions.

The physical contract must therefore introduce an explicit concurrency primitive, preferably a monotonic Payment version used in a conditional update, or an equivalent transaction/locking strategy.

The production rule is:

**a stale writer must fail rather than overwrite a newer committed Payment state.**

## 11. Transaction boundary

The physical transaction must preserve:

validate → authorize → create/update Payment + canonical Action linkage → record canonical Event/Evidence where applicable → commit

External provider execution remains outside the local atomic database transaction.

An unresolved external outcome must be persistable as UNKNOWN or RECONCILIATION_REQUIRED, never silently as COMPLETED.

## 12. Migration safety boundary

No migration is created by this reconciliation.

Before any migration can be executed, the repository must have:

1. a versioned physical schema contract;
2. the Payments application contract updated for actionId;
3. implementation updated against that contract;
4. deterministic physical persistence tests;
5. migration forward-path tests;
6. rollback/recovery analysis;
7. compatibility analysis with the current database state;
8. non-production verification;
9. explicit production approval.

Migration 023 remains outside production until these gates are independently verified.

## 13. Required next implementation sequence

The architecture is now reconciled enough to stop changing the foundation.

The next controlled sequence is:

**Payments Action-Link Contract Update**
→ **Payments Implementation Update**
→ **DB-neutral Persistence Update**
→ **Physical PostgreSQL Schema Contract**
→ **Migration Safety Reconciliation**
→ **Physical Persistence Implementation**
→ **Deterministic Physical-Persistence Verification**
→ **CI**
→ **Final Physical Persistence Reconciliation**

Only after those gates may a production migration or Neon mutation be considered.

## 14. Explicit non-goals

This reconciliation does not authorize:

- modifying EntityType;
- changing BeatCore Action/Event/Evidence semantics;
- provider integration;
- webhooks;
- M-PESA/bank/card implementation;
- production SQL execution;
- Neon writes;
- migration execution;
- deployment;
- UI changes;
- hardware.

## Gate

**🟢 VERIFIED — PAYMENTS PHYSICAL PERSISTENCE BOUNDARY RECONCILED.**

The two open architectural questions are resolved:

- payment remains Payments-owned and is **not** added to foundational EntityType.
- consequential Payment ↔ canonical Action linkage is recognized as a required application/contract refinement via an optional actionId reference before physical schema finalization.

The physical PostgreSQL schema is now sufficiently bounded to proceed, but **physical implementation remains locked until the Payment Action-link contract is updated and verified.**
