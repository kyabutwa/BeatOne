# Evidence Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED
**Date:** 2026-10-01

## Canonical ownership

`evidences` → Evidence.

The DB-neutral StoredEvidence representation remains sufficient:
- id
- eventId?
- source
- verification
- recordedAt
- externalProvider?
- externalReference?

## Repository enforcement

For every persisted Evidence:
- id is unique;
- source is non-empty;
- recordedAt is a valid timestamp;
- verification is exactly UNVERIFIED, VERIFIED, or REJECTED;
- linked Event, when present, must exist;
- external provider/reference are both present or both absent;
- provider/reference are non-empty when present.

## Transaction semantics

Evidence writes use the same DB-neutral repository transaction boundary. A failed Evidence validation does not publish the attempted record.

## Semantic boundary

Persistence does not convert Evidence into Event, Action, Authorization, or verified real-world truth.

UNVERIFIED remains the default creation state.

## Scope

No production schema, migration, ORM, database vendor, provider, infrastructure, automatic verification, GENESIS, OneApp, or Website work is introduced.

**Result: 🟢 VERIFIED — Evidence persistence is canonically owned and invariant-enforced.**
