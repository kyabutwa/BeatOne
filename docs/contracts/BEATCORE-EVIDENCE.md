# BeatCore Evidence Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT
**Date:** 2026-10-01

## Purpose

Evidence is a canonical record that supports, qualifies, or documents an Event or other canonical claim.

Evidence is distinct from Event and does not itself create an Event.

## Canonical shape

```ts
Evidence {
  id,
  eventId?,
  source,
  verification,
  recordedAt,
  externalReference?
}
```

## Verification state

- UNVERIFIED — recorded, but not established as verified;
- VERIFIED — explicitly verified by an authorized verification process;
- REJECTED — explicitly rejected by an authorized verification process.

Evidence creation defaults to UNVERIFIED. Creation never silently upgrades verification.

## Invariants

- id is non-empty;
- source is non-empty;
- recordedAt is a valid timestamp;
- verification is one of the canonical verification states;
- when eventId is supplied, the canonical Event must exist;
- external provider and external reference are either both present or both absent;
- provider and reference are non-empty when present;
- external identifiers remain secondary metadata;
- Evidence ID remains the canonical Evidence identity.

## Event/Evidence boundary

Event records an occurrence.

Evidence supports or qualifies a claim about an occurrence.

An Event does not automatically become Evidence, and Evidence does not automatically become an Event.

## Real-world claims

Evidence does not automatically prove a real-world claim merely because it exists.

Verification state must reflect an actual verification process. UNVERIFIED is the safe creation state.

## Persistence

`evidences` is the canonical persistence owner.

A linked Event must resolve inside the transaction. Failed Evidence persistence must not publish a partial transaction.

## Non-goals

No automatic verification, GENESIS, external provider execution, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.
