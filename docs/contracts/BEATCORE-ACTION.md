# BeatCore Action Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Action

Action contains: id, actorId, optional proposalId, authorizationId, state, operation, optional contextId, correlationId, and idempotencyKey.

An Action is the canonical record of an authorized operation. It is not proof that the real-world operation completed.

## Invariants

- id, actorId, authorizationId, and operation are non-empty;
- actorId references an existing Identity;
- authorizationId references an existing Authorization;
- the persisted canonical Authorization is the authority source for the Action;
- that Authorization must be ALLOW and valid at the operation time;
- Action actor must equal Authorization actor;
- optional Proposal must exist and its actor must equal Action actor;
- optional Context must exist;
- authorized creation uses state AUTHORIZED;
- lifecycle transitions must pass the canonical transition matrix;
- idempotency keys are unique across Actions;
- duplicate Action IDs conflict;
- Action is distinct from Event and Evidence.

## Authority source of truth

A caller may identify an Authorization, but a caller-supplied Authorization object must not be able to manufacture authority by reusing an existing Authorization ID with different decision, validity, actor, capability, or scope data.

The authorized Action operation therefore validates against the canonical persisted Authorization record.

## Proposal boundary

Authorization remains the authority boundary.
A Proposal does not become an Action automatically.
If an Action references a Proposal, that Proposal must already exist and belong to the same actor.

## State semantics

AUTHORIZED means the canonical operation passed the authorization gate. It does not mean the external, physical, or real-world operation completed.

## Atomic operation

The authorized-action operation performs validation, authorization, Action creation, local Event creation, persistence of both, and commit in one local transaction.

`AUTHORIZED Action → ACTION_AUTHORIZED Event` is a local canonical occurrence, not a real-world completion claim.

External operations remain outside this local atomic boundary.

## Non-goals

No Event redesign, Evidence implementation, GENESIS automation, external provider, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.
