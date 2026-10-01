# BeatCore Event Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Purpose

Event is the canonical record of an occurrence observed or recorded by BeatOne.

Event is distinct from Action and Evidence.

## Canonical shape

```ts
Event {
  id,
  actionId?,
  type,
  occurredAt,
  state,
  actorId?,
  contextId?,
  source,
  correlationId?,
  causationId?,
  version
}
```

## Invariants

- id is non-empty;
- type is non-empty;
- source is non-empty;
- occurredAt is a valid timestamp;
- version is a positive integer;
- when actionId is supplied, the referenced Action must exist;
- when actionId is supplied, Event.state must equal the referenced Action.state at the recorded occurrence;
- when actorId is supplied with actionId, it must equal Action.actorId;
- when contextId is supplied with actionId, it must equal Action.contextId when the Action has a context;
- Event does not grant authorization;
- Event does not prove real-world completion by itself;
- Event is not Evidence.

## Action/Event lifecycle boundary

The canonical local foundation operation records:

`AUTHORIZED Action → ACTION_AUTHORIZED Event`

The Event state is therefore AUTHORIZED for that occurrence.

A COMPLETED Event must not be fabricated from an AUTHORIZED Action snapshot. A later Action lifecycle transition must exist before a corresponding later-state Event is recorded.

## Standalone events

An Event may exist without actionId when a domain contract explicitly requires an occurrence that is not caused by an Action.

Standalone Event creation still requires valid type, source, occurredAt, state, and version.

## Transaction semantics

When Event is recorded with an Action in a local consequential operation, both are persisted inside the same local transaction.

A failed Event write must not publish a partial Action.

## External and real-world semantics

External provider acceptance is not automatically a completed real-world Event.

Unknown outcomes remain explicitly unknown/pending/reconciliation-required.

Evidence remains a separate canonical entity and may be required to establish real-world claims.

## Non-goals

No Evidence implementation, GENESIS automation, external provider, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.
