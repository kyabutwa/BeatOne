# Intent + Proposal Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED
**Date:** 2026-10-01

## Canonical ownership

- `intents` → Intent
- `proposals` → Proposal

Existing DB-neutral representations are sufficient.

Intent:
- id
- actorId
- purpose
- contextId?

Proposal:
- id
- actorId
- intentId
- summary
- authorizationId?

## Repository enforcement

The repository enforces:
- Intent actor Identity reference;
- optional Context reference;
- Proposal actor Identity reference;
- Proposal Intent reference;
- optional Authorization reference;
- Proposal Authorization actor must match Proposal actor;
- non-empty purpose and summary;
- duplicate IDs through the existing transaction boundary.

## Authority boundary

A Proposal may exist without Authorization.

An Authorization attached to a Proposal remains a reference to an existing authority decision; it does not execute an Action.

No Action, Event, or Evidence is created by Intent or Proposal persistence.

## Schema decision

No production schema, migration, ORM, database vendor, external provider, or infrastructure work is introduced.

**Result: 🟢 VERIFIED — Intent + Proposal persistence representation is sufficient and canonically owned.**
