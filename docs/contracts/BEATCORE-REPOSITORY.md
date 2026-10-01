# BeatCore Persistence Repository Boundary

**Status:** PROPOSED FOR IMPLEMENTATION  
**Scope:** repository behavior and local transaction semantics only  
**Database vendor:** intentionally unspecified

## 1. Purpose

This contract defines the behavior between BeatCore application/domain code and concrete persistence storage.

It sits immediately above the database-neutral persistence representation. It does not select a database, ORM, migration runner, cloud provider, or production schema.

The repository boundary owns persistence mechanics. It does not own product authorization, identity meaning, or domain policy.

## 2. Boundary

The dependency direction is:

`BeatCore domain contract → persistence representation → repository boundary → concrete adapter`

The repository boundary exposes:
- canonical record reads;
- canonical record insertion/replacement inside a transaction;
- idempotency lookup for consequential Actions;
- atomic local transaction semantics.

The boundary does not expose:
- SQL;
- ORM models;
- database connections;
- provider-specific transactions;
- HTTP requests;
- payment/provider calls;
- authentication-provider semantics;
- alternate identity or authorization stores.

## 3. Repository rules

1. Canonical IDs remain the persisted record identity.
2. A repository must not manufacture missing records.
3. Inserts reject duplicate canonical IDs.
4. Replacements reject missing canonical IDs.
5. Declared references must point to records visible inside the same transaction.
6. Action persistence requires an existing authorization record.
7. Event persistence may reference an Action, but an Event remains a separate record.
8. Evidence persistence may reference an Event, but Evidence remains a separate record.
9. Proposal persistence does not require authorization.
10. Action idempotency keys are unique within the repository's consequential-operation scope.
11. Unknown external outcomes are not converted to completion by the repository.
12. Read operations observe committed state outside a transaction.
13. A failed transaction publishes none of its writes.
14. A successful transaction publishes all of its local writes together.
15. The repository cannot bypass domain authorization; it only persists the authorization basis supplied by the caller.

## 4. Transaction contract

A consequential local operation is represented as:

`validate → authorize → state transition → repository writes → event recording → commit`

The repository guarantees atomicity only for local persistence.

External operations occur outside this atomic boundary. If an external operation has an unknown outcome, the caller must persist an explicit state that supports reconciliation; the repository must not fabricate success.

## 5. Consistency checks

The first repository implementation enforces:
- required identifiers/text are non-empty;
- duplicate primary IDs are rejected;
- required referenced records exist;
- Action authorization exists;
- Action idempotency keys are unique;
- Event version is a positive integer;
- Event/Evidence references resolve when supplied;
- external provider/reference must be supplied as a pair.

The repository does not infer generic Relationship subject/target entity types because the canonical persistence representation intentionally does not introduce artificial type columns for them.

## 6. In-memory implementation

The initial implementation is an executable contract adapter used for deterministic foundation tests.

It is not production storage.

Its transaction implementation uses an isolated working state and publishes that state only after the transaction callback succeeds. This proves repository-level atomicity without introducing a database vendor.

## 7. Required tests

The repository layer is complete for this stage only when tests demonstrate:

- empty committed repository reads as absent;
- canonical records can be inserted and read;
- duplicate IDs fail;
- missing required references fail;
- proposal can exist without authorization;
- action requires authorization;
- duplicate Action idempotency keys fail;
- Event remains separate from Action;
- Evidence remains separate from Event;
- a failed transaction rolls back all earlier writes in that transaction;
- a successful transaction commits all local writes together;
- repository code does not manufacture external completion.

## 8. Explicit non-goals

This stage does not implement:
- PostgreSQL/Neon;
- SQL schema;
- migrations;
- production connection management;
- API endpoints;
- authentication;
- authorization policy engines;
- external payment/provider calls;
- queues or distributed transactions;
- read-model/search infrastructure.

## 9. Completion gate

The repository boundary may be considered verified only after:

**Contract → Implementation → Tests → CI → Runtime-independent transaction verification**

Only after that gate should a concrete database adapter be introduced.
