# Relationship + Context Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED
**Date:** 2026-10-01

Canonical ownership remains:

- `relationships` → Relationship
- `contexts` → Context

The existing DB-neutral stored representations are sufficient:

- Relationship: id, subjectId, targetId, kind, validFrom, validUntil?
- Context: id, participantId, placeId?, communityId?, purpose?

Repository enforcement now covers:

- Relationship required fields;
- self-relationship rejection;
- validFrom timestamp validity;
- validUntil timestamp validity and ordering;
- Context Participant reference;
- optional Place reference;
- optional Community reference;
- optional non-empty purpose;
- duplicate IDs through the existing repository transaction boundary.

No new persistence model competes with these canonical tables.

No production schema, migration, ORM, database vendor, or external provider is introduced.

Production physical schema work remains subject to the existing migration safety sequence.

**Result: 🟢 VERIFIED — Relationship + Context persistence representation is sufficient and canonically owned.**
