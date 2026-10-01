# Capability + Authorization Fresh Reconciliation

**Status:** 🟢 VERIFIED — RECONCILIATION COMPLETE
**Date:** 2026-10-01

## Reviewed
Product Architecture, Technical Architecture, BeatCore, persistence, repository, People + Communities, Identity + Participant, Access, Place/Building/Floor/Unit/Resource, and Relationship + Context.

## Findings
Canonical Capability and Authorization types and persistence owners already exist:
- capabilities → Capability
- authorizations → Authorization

The repository already enforces core references from Authorization to Identity, Capability, Participant, Context, Relationship, and delegated Identity.

The missing foundation boundary is a dedicated contract, creation operations, explicit invariant tests, and final reconciliation.

## Canonical boundary
Capability describes a named ability that may later be granted through Authorization.

Authorization records a decision for an actor against a Capability, optionally scoped by Participant, Context, Relationship, scope, and delegation, with explicit temporal validity.

Capability does not grant authority by itself.
Authorization is the authority decision.
Authentication is separate.
Participant, Context, Relationship, and Capability do not silently create authorization.

## Dependency
Relationship + Context → Capability + Authorization → Intent + Proposal

## Explicit non-goals
No authentication provider, credentials, sessions, external provider, migration, production database, infrastructure, GENESIS, Intent, Proposal, Action, Event, or Evidence implementation.

## Controlled sequence
Fresh Reconciliation → Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation.

**Gate: 🟢 VERIFIED — CAPABILITY + AUTHORIZATION FOUNDATION REQUIRES IMPLEMENTATION.**
