# Event Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED
**Date:** 2026-10-01

## Canonical ownership

- `events` → Event

The DB-neutral StoredEvent representation remains sufficient:
- id
- actionId?
- type
- occurredAt
- state
- actorId?
- contextId?
- source
- correlationId?
- causationId?
- version

## Repository enforcement

For every persisted Event:
- id is unique;
- type and source are non-empty;
- occurredAt is a valid timestamp;
- version is a positive integer;
- linked Action must exist;
- linked Event state must equal the linked Action state;
- linked Event actor, when supplied, must equal Action actor;
- linked Event context, when supplied, must agree with Action context;
- actor/context references must resolve.

## Transaction semantics

The existing authorized Action operation persists Action and its local Event in one local transaction.

If Event validation or persistence fails, the Action is not committed.

## Semantic boundary

Persistence does not turn an Event into Evidence and does not claim external completion.

An Event is an occurrence record. Evidence is a separate canonical entity.

## Scope

No production schema, migration, ORM, database vendor, provider, infrastructure, or external operation is introduced.

**Result: 🟢 VERIFIED — Event persistence is canonically owned and invariant-enforced.**
