# Intent + Proposal Fresh Reconciliation

**Status:** 🟢 VERIFIED — RECONCILIATION COMPLETE
**Date:** 2026-10-01

## Reviewed
Product Architecture, Technical Architecture, BeatCore, persistence, repository, People + Communities, Identity + Participant, Access, Place/Building/Floor/Unit/Resource, Relationship + Context, and Capability + Authorization.

## Findings
Canonical Intent and Proposal types and persistence owners already exist:
- intents → Intent
- proposals → Proposal

The missing foundation boundary is a dedicated contract, creation operations, explicit invariant tests, and final reconciliation.

## Canonical boundary
Intent records an actor's declared purpose and may reference Context.
Proposal records a proposed course of action derived from an Intent and may reference an Authorization.

Intent does not execute anything.
Proposal does not become Action automatically.
Proposal does not manufacture Authorization.

Authorization remains the authority boundary for consequential Action.

## Dependency
Capability + Authorization → Intent + Proposal → Action

## Explicit non-goals
No Action execution, Event creation, Evidence creation, GENESIS automation, external provider, migration, production database, infrastructure, or higher-domain implementation.

## Controlled sequence
Fresh Reconciliation → Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation.

**Gate: 🟢 VERIFIED — INTENT + PROPOSAL REQUIRES IMPLEMENTATION.**
