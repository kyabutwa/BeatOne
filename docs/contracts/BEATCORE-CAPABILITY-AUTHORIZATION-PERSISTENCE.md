# Capability + Authorization Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED
**Date:** 2026-10-01

## Canonical ownership

- `capabilities` → Capability
- `authorizations` → Authorization

The existing DB-neutral stored representations are sufficient.

Capability:
- id
- name

Authorization:
- id
- decision
- actorId
- participantId?
- contextId?
- relationshipId?
- capabilityId
- validFrom
- validUntil?
- scope?
- delegatedBy?

## Repository enforcement

The repository enforces:
- canonical Identity reference for actor;
- canonical Capability reference;
- optional Participant, Context, Relationship and delegated Identity references;
- validFrom timestamp;
- validUntil timestamp and ordering;
- non-empty scope when supplied;
- duplicate IDs through the transaction boundary.

## Authority boundary

Persistence does not turn Capability into authority.

Authorization remains the canonical authority decision.

Creating an Authorization does not create Action, Event, or Evidence.

## Schema decision

No production schema or migration is introduced.

No ORM, database vendor, authentication provider, external provider, or infrastructure work is introduced.

## Result

**🟢 VERIFIED — Capability + Authorization persistence representation is sufficient and canonically owned.**
