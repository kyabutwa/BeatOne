# Action Persistence Reconciliation

**Status:** 🟢 VERIFIED - RECONCILED
**Date:** 2026-10-01

## Canonical ownership

- actions -> Action

Existing DB-neutral StoredAction is sufficient:
- id
- actorId
- proposalId?
- authorizationId
- state
- operation
- contextId?
- correlationId?
- idempotencyKey?

## Repository enforcement

The repository now enforces:
- Action actor references an existing Identity;
- Authorization exists;
- Authorization actor equals Action actor;
- the persisted Authorization is the authority source; caller-supplied Authorization fields cannot override persisted decision/validity;
- optional Proposal exists;
- Proposal actor equals Action actor;
- optional Context exists;
- operation is non-empty;
- idempotency keys are unique;
- duplicate Action IDs conflict.

## Transaction semantics

The authorized Action operation persists Action and its local Event in the same local transaction.

A failed transaction publishes neither record.

## Lifecycle

The canonical lifecycle transition matrix remains owned by BeatCore. Persistence does not invent new lifecycle states or transitions.

## Boundary

Action authorization is canonical. Event is a separate occurrence record. Evidence remains separate.

No production schema, migration, ORM, database vendor, provider, or infrastructure work is introduced.

**Result: 🟢 VERIFIED - Action persistence is canonically owned and invariant-enforced.**
