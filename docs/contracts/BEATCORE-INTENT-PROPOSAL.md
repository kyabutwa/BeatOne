# BeatCore Intent + Proposal Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Intent

Intent represents an actor's declared purpose.

Shape:
```ts
Intent { id, actorId, purpose, contextId? }
```

Invariants:
- id, actorId, purpose are non-empty;
- actorId references an Identity;
- contextId, when present, references Context;
- duplicate IDs conflict;
- Intent does not authorize or execute an Action.

## Proposal

Proposal represents a proposed course of action derived from an Intent.

Shape:
```ts
Proposal { id, actorId, intentId, summary, authorizationId? }
```

Invariants:
- id, actorId, intentId, summary are non-empty;
- actorId references an Identity;
- intentId references an Intent;
- optional authorizationId references an Authorization;
- if authorizationId is present, its actorId must match the Proposal actorId;
- duplicate IDs conflict;
- Proposal does not execute an Action;
- absence of authorization does not become authorization.

## Authority boundary

```
Intent ≠ Authorization
Proposal ≠ Authorization
Proposal ≠ Action
Authorization ≠ Action
```

A Proposal may exist before authorization. An Authorization may be associated with a Proposal, but only the existing Action domain operation can create an authorized Action from a valid Authorization.

## Persistence

Canonical ownership:
```
intents → Intent
proposals → Proposal
```

Transaction:
validate → validate references → persist → commit.

## Non-goals

No Action execution, Event, Evidence, GENESIS automation, authentication provider, external provider, migration, production DB, infrastructure, or higher-domain implementation.

## Gate

Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation.
