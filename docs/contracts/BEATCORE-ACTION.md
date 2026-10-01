# BeatCore Action Contract

**Status:** VERIFIED - IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Action

Action contains: id, actorId, optional proposalId, authorizationId, state, operation, optional contextId, correlationId, and idempotencyKey.

An Action is the canonical record of an authorized operation. It is not proof that the real-world operation completed.

## Invariants

- id, actorId, authorizationId, and operation are non-empty;
- authorization must exist;
- Action actor must equal Authorization actor;
- optional Proposal must exist and its actor must equal Action actor;
- optional Context must exist;
- authorized creation uses state AUTHORIZED;
- lifecycle transitions must pass the canonical transition matrix;
- idempotency keys are unique across Actions;
- duplicate Action IDs conflict;
- Action is distinct from Event and Evidence.

## Authority

Authorization is the authority boundary for Action creation.
A Proposal does not become an Action automatically.

## State semantics

AUTHORIZED means the canonical operation passed the authorization gate. It does not mean the external or physical world completed the operation.

## Atomic operation

The existing authorized-action operation performs validation, authorization, Action creation, local Event creation, persistence of both, and commit in one local transaction.

External operations remain outside this local atomic boundary.

## Non-goals

No external provider, real-world completion claim, Evidence implementation, GENESIS automation, migration, production database, infrastructure, or higher-domain implementation.
