# BeatOne — Payments Persistence Reconciliation

**Status:** RECONCILIATION COMPLETE — PROPOSED PERSISTENCE REPRESENTATION
**Date:** 2026-10-01
**Scope:** Payments-domain persistence representation only
**Authority:** `BEATCORE-PAYMENTS.md` + frozen BeatCore persistence/repository contracts
**Database vendor:** intentionally unspecified

## 1. Purpose

This document reconciles the verified Payments implementation against the existing BeatCore persistence representation and repository boundary before any concrete Payments persistence implementation.

This stage does not implement a database adapter, SQL schema, migration, production connection, provider integration, or deployment.

The purpose is to prove exactly what Payments persistence must represent, what remains owned by BeatCore, and where the existing generic persistence model is insufficient for Payment-domain state.

## 2. Existing foundation audited

The existing repository provides:

- canonical opaque IDs;
- transactional insert/replace semantics;
- committed reads;
- reference validation;
- Action authorization linkage;
- Action idempotency uniqueness;
- Action/Event separation;
- Event/Evidence separation;
- transaction rollback on failed work;
- transaction commit of successful local writes.

The existing DB-neutral persistence representation currently contains:

- persons;
- communities;
- identities;
- accounts;
- credentials;
- sessions;
- participants;
- accesses;
- places;
- contexts;
- relationships;
- capabilities;
- authorizations;
- intents;
- proposals;
- actions;
- events;
- evidences.

There is currently **no canonical Payments persistence representation** and no `StoredPayment` or `payments` persistence table.

## 3. Critical reconciliation finding

Payments cannot be persisted by reusing `actions` as the Payment record.

An Action and a Payment have different meanings:

- Action = canonical consequential operation in BeatCore;
- Payment = Payments-domain business state and monetary operation.

The Payment must therefore have its own persistence identity and representation.

The Payment Action remains separately persisted through the canonical Action representation.

The relationship is:

`Payment Intent → Authorization → Action → Payment state → Event → Evidence`

A Payment record must not replace, duplicate, or redefine the canonical Action/Event/Evidence records.

## 4. Canonical ownership

| Representation | Owner | Primary identity |
|---|---|---|
| payments | Payments | paymentId |
| actions | BeatCore / Action | action.id |
| events | BeatCore / Event | event.id |
| evidences | BeatCore / Evidence | evidence.id |
| authorizations | BeatCore / Authorization | authorization.id |
| participants | BeatCore / Participant | participant.id |
| identities | BeatCore / Identity | identity.id |

Payments owns the `payments` representation.

Payments does not create a second authorization, Action, Event, or Evidence store.

## 5. Proposed DB-neutral Payment representation

The canonical Payment persistence record should contain:

- `id` — stable opaque Payment identity;
- `payer_participant_id` — optional Participant reference;
- `payee_participant_id` — optional Participant reference;
- `amount` — exact decimal monetary representation;
- `currency` — explicit normalized three-letter currency code;
- `purpose` — required payment purpose/reference;
- `status` — explicit Payments-domain status;
- `actor_id` — required Identity reference;
- `authorization_id` — required Authorization reference;
- `idempotency_key` — required consequential-operation idempotency identity;
- `request_id` — optional request identifier;
- `correlation_id` — optional correlation identifier;
- `causation_id` — optional causation identifier;
- `external_provider` — optional provider identifier;
- `external_reference` — optional provider reference;
- `created_at` — required timestamp;
- `updated_at` — required timestamp.

The field names above are a DB-neutral representation, not a production SQL schema.

## 6. Payment identity

`payment.id` is the canonical Payment identity.

It must be:

- opaque;
- stable;
- unique;
- independent of external provider IDs;
- distinct from Action, Event, Evidence, Authorization, and request IDs.

Provider references cannot become Payment primary keys.

## 7. Participant references

When supplied:

- `payer_participant_id` must reference an existing Participant;
- `payee_participant_id` must reference an existing Participant.

The persistence layer must not manufacture Participants from payment data.

Participant identity remains owned by BeatCore.

The optionality of payer/payee references is intentional and must not be replaced by fabricated identities.

## 8. Actor and authorization

Every consequential Payment must preserve:

`payment.actor_id → authorization.actor_id`

The referenced Authorization must exist.

The persisted authorization is the authority source; Payment persistence must not duplicate or override its decision, validity, capability, participant, context, relationship, scope, or delegation semantics.

Payment persistence does not authorize a payment.

Authorization remains a BeatCore concern.

## 9. Monetary representation

Amount must remain exact and unambiguous.

Persistence must preserve the canonical normalized decimal representation produced by the Payments implementation.

Floating-point storage must not be introduced where it can change monetary meaning.

Currency is explicit and normalized to a three-letter uppercase representation.

The persistence layer must never infer currency from a provider, participant, location, or account.

## 10. Payment status

Payment status is Payments-domain state.

The canonical status set established by the Payments implementation is:

- REQUESTED
- AUTHORIZED
- PROCESSING
- PENDING
- COMPLETED
- FAILED
- DENIED
- REJECTED
- CANCELLED
- PARTIAL
- UNKNOWN
- REVERSED
- RECONCILIATION_REQUIRED
- RECONCILED

These statuses must not be silently collapsed into the generic BeatCore `LifecycleState` set.

In particular:

- UNKNOWN is not COMPLETED;
- PENDING is not COMPLETED;
- RECONCILIATION_REQUIRED is not COMPLETED;
- provider acceptance is not completion.

## 11. Action relationship

A Payment consequential operation must retain its canonical Action separately.

The Payment record may carry the Action identifier in a later concrete representation if the final application contract requires direct linkage, but this reconciliation does not invent a new field that is absent from the verified Payment domain contract.

At minimum, the application transaction must preserve the relationship:

`Payment authorization → canonical Action → Payment state transition`

The Action remains subject to the existing Action persistence contract:

- existing authorization;
- matching actor;
- valid lifecycle state;
- unique idempotency within its consequential-operation scope.

## 12. Idempotency

Payment initiation requires an idempotency identity.

The persistence design must enforce:

- non-empty Payment idempotency key;
- duplicate reuse does not create a duplicate consequential Payment outcome;
- materially conflicting reuse is rejected;
- the uniqueness scope is explicitly defined before physical schema implementation;
- webhook/callback idempotency remains separate from merely storing an external reference.

The existing Action idempotency constraint is not automatically sufficient for Payment persistence because Payment is a separate canonical domain record.

The concrete persistence implementation must reconcile Payment and Action idempotency scopes rather than accidentally creating two contradictory uniqueness rules.

## 13. External references

Provider references are secondary.

If an external provider reference is stored, both provider and reference must be present.

Neither may become the canonical Payment identity.

Provider acknowledgement must not mutate Payment directly into COMPLETED without the applicable recognized event/evidence semantics.

Unknown, timeout, contradictory, or unresolved provider outcomes must remain representable.

## 14. Correlation and causation

The persistence representation preserves:

- request identifier;
- correlation identifier;
- causation identifier.

These are trace relationships, not business identity.

They must remain distinct.

The persistence layer must not reuse Payment ID, Action ID, Event ID, or provider reference as a substitute merely for convenience.

## 15. Event boundary

The existing Event persistence representation remains canonical.

Payment persistence must not create a second Payment Event table.

A recognized payment occurrence is persisted as the canonical Event entity.

The existing Event invariant remains:

- linked Action exists when supplied;
- Event state agrees with the linked Action state;
- actor/context references remain valid;
- Event remains separate from Payment and Evidence.

A Payment-specific status transition such as UNKNOWN or PENDING must not be forced into a generic Event lifecycle value merely to satisfy storage.

The Payment record remains the source for Payments-domain status; the Event remains the occurrence record.

## 16. Evidence boundary

The existing Evidence persistence representation remains canonical.

Payments must not create a parallel evidence store.

Provider evidence may be represented through canonical Evidence using:

- source;
- verification state;
- recorded timestamp;
- optional external provider/reference.

UNVERIFIED remains distinct from VERIFIED.

Persistence does not independently declare external reality to be true.

## 17. Transaction boundary

A local consequential Payment operation must preserve the existing transaction discipline:

`validate → authorize → state transition → persist local records → record Event/Evidence where contractually applicable → commit`

All local writes that form one atomic operation must publish together.

If a local validation or persistence operation fails, none of the transaction's writes may become visible.

External provider execution remains outside the local atomic boundary.

An unknown external outcome must leave a persisted Payment state that supports reconciliation.

## 18. Reference integrity

The eventual repository adapter must enforce, where fields are supplied:

- payer Participant exists;
- payee Participant exists;
- actor Identity exists;
- Authorization exists;
- Authorization actor matches Payment actor;
- linked Action exists when a Payment/Action linkage is persisted;
- linked Event exists when an application-level Payment/Event linkage is persisted;
- external provider/reference are supplied as a pair.

The persistence layer must not manufacture missing records.

## 19. Replacement semantics

Payment replacement must:

- reject a missing Payment ID;
- preserve canonical Payment identity;
- preserve required ownership relationships;
- validate the complete replacement record;
- reject invalid status values;
- preserve exact monetary representation;
- preserve idempotency semantics.

A replacement must not silently reset a Payment from UNKNOWN, RECONCILIATION_REQUIRED, or other non-terminal state to COMPLETED.

## 20. Concurrency and stale state

A concrete adapter must protect consequential Payment updates from lost-update behavior.

The physical implementation must define an explicit concurrency mechanism before production use, such as a version/compare-and-swap strategy or equivalent transactional locking.

This reconciliation does not select the mechanism.

A stale writer must not overwrite a newer Payment state and accidentally erase reconciliation information.

## 21. Repository API impact

The existing repository boundary is generic over `PersistenceTable`.

Introducing Payments persistence later therefore requires a deliberate contract update to:

- `PersistenceTable`;
- `PersistenceRecordMap`;
- transaction access;
- in-memory repository initialization;
- record validation;
- Payment-specific idempotency lookup or equivalent;
- required tests.

This must be implemented as one coherent repository contract change.

It must not be patched through ad-hoc casts or direct storage access.

## 22. Physical schema boundary

No physical schema is authorized by this reconciliation.

Specifically, this stage does not introduce:

- PostgreSQL/Neon tables;
- SQL;
- ORM models;
- indexes in a database;
- migration files;
- migration execution;
- production connection management;
- production database changes.

The DB-neutral representation is the only output of this stage.

## 23. Migration safety gate

When concrete persistence is later implemented, the required sequence is:

`Contract Review → Schema Review → Application Compatibility → Migration Test → Rollback/Recovery → Non-prod Verification → Production Approval → Production Verification`

No production migration may bypass this sequence.

## 24. Required implementation tests after this reconciliation

Before a concrete Payments persistence adapter can be considered verified, tests must demonstrate at minimum:

1. Payment can be represented and persisted with canonical fields.
2. Duplicate Payment IDs fail.
3. Missing payer Participant fails when payer is supplied.
4. Missing payee Participant fails when payee is supplied.
5. Missing actor Identity fails.
6. Missing Authorization fails.
7. Authorization actor mismatch fails.
8. Exact amount representation is preserved.
9. Currency remains explicit and normalized.
10. Invalid Payment status fails.
11. Payment idempotency is enforced.
12. Conflicting idempotency reuse fails.
13. Provider/reference pairs are atomic.
14. External provider references remain secondary.
15. UNKNOWN remains UNKNOWN.
16. RECONCILIATION_REQUIRED remains explicitly representable.
17. Payment and Action remain separate records.
18. Payment and Event remain separate records.
19. Payment and Evidence remain separate records.
20. Failed local transaction publishes none of its Payment writes.
21. Successful local transaction publishes all required local Payment writes together.
22. Stale concurrent replacement cannot erase a newer state.
23. No provider acknowledgement is converted into COMPLETED by persistence.
24. Existing BeatCore repository tests remain green.

## 25. Explicit non-goals

This stage does not implement:

- PostgreSQL/Neon;
- SQL schema;
- migrations;
- production persistence;
- provider adapters;
- M-PESA;
- bank/card/wallet integrations;
- webhook processing;
- API endpoints;
- UI;
- GENESIS expansion;
- Commerce fulfillment;
- Economy accounting;
- deployment.

## 26. Reconciliation result

### 🟢 VERIFIED — PAYMENTS PERSISTENCE BOUNDARY RECONCILED

The existing BeatCore persistence foundation is reusable for the Payment's references and transaction mechanics, but it does not currently contain a canonical Payment representation.

The required architectural conclusion is:

**Payments requires its own DB-neutral `payments` representation while continuing to use the canonical BeatCore Authorization, Action, Event, and Evidence records.**

The next stage is therefore **Payments Persistence Implementation**, not a production migration.

Implementation must first extend the DB-neutral repository contract coherently, then add deterministic persistence tests, then run CI verification.

No production database or migration is authorized by this reconciliation.
