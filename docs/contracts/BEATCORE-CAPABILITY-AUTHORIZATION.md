# BeatCore Capability + Authorization Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Capability

Capability is a canonical named ability.

Shape:
```ts
Capability { id, name }
```

Invariants:
- id is non-empty;
- name is non-empty;
- duplicate IDs conflict;
- Capability alone does not grant authority.

## Authorization

Authorization is the canonical authority decision connecting an actor to a Capability.

Shape:
```ts
Authorization {
  id,
  decision,
  actorId,
  participantId?,
  contextId?,
  relationshipId?,
  capabilityId,
  validFrom,
  validUntil?,
  scope?,
  delegatedBy?
}
```

Invariants:
- id, actorId, capabilityId, validFrom are non-empty;
- decision is ALLOW, DENY, or CONDITIONAL;
- actorId references an Identity;
- capabilityId references a Capability;
- optional Participant, Context, Relationship, and delegatedBy references must exist;
- validFrom must be a valid timestamp;
- validUntil, when present, must be valid and strictly after validFrom;
- scope, when present, must be non-empty;
- delegatedBy, when present, identifies the delegating Identity and does not itself bypass policy;
- duplicate IDs conflict.

## Authority semantics

```
Identity ≠ Authentication
Capability ≠ Authorization
Participant ≠ Authorization
Context ≠ Authorization
Relationship ≠ Authorization
Authorization ≠ Action
```

Only an Authorization with decision ALLOW and a currently valid time window may satisfy the existing action authorization gate. DENY and CONDITIONAL do not create an authorized Action.

Creating an Authorization does not execute an Action and does not create an Event or Evidence.

## Persistence

Canonical ownership:
```
capabilities → Capability
authorizations → Authorization
```

The repository remains the persistence boundary.

## Transaction

validate → validate references → persist → commit.

No partial record is published after failed validation.

## Non-goals

No authentication provider, Account/Credential/Session implementation, external provider, production DB, migration, infrastructure, Intent, Proposal, Action, Event, Evidence, or GENESIS implementation.

## Gate

Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation.
