# BeatCore Relationship + Context Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT  
**Scope:** Relationship + Context  
**Date:** 2026-10-01

## Relationship
Relationship records a canonical relation between a subject and target.

Canonical shape:
Relationship { id, subjectId, targetId, kind, validFrom, validUntil? }

Invariants:
1. id, subjectId, targetId, kind, and validFrom are non-empty.
2. subjectId and targetId must reference existing canonical participants or entities represented by canonical IDs.
3. subjectId may not equal targetId.
4. validFrom must be a valid timestamp.
5. validUntil, when present, must be a valid timestamp after validFrom.
6. duplicate IDs are conflicts.
7. Relationship does not grant capability or authorization.

## Context
Context records the contextual state in which a Participant operates.

Canonical shape:
Context { id, participantId, placeId?, communityId?, purpose? }

Invariants:
1. id and participantId are non-empty.
2. participantId must reference an existing Participant.
3. placeId, when present, must reference an existing Place.
4. communityId, when present, must reference an existing Community.
5. purpose, when present, must be non-empty.
6. duplicate IDs are conflicts.
7. Context does not grant capability or authorization.

## Boundaries
Relationship is not Capability or Authorization.
Context is not Authorization.
Authentication is not created by either operation.
Place and Community remain authoritative in their own domains.

## Transaction
validate → validate references → repository transaction → commit.
Failed creation publishes no partial record.

## Non-goals
No Capability, Authorization, auth provider, external provider, migration, production DB, infrastructure, GENESIS, or higher-domain implementation.

## Gate
Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation.