# BeatCore Place Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT  
**Scope:** Place / Building / Floor / Unit / Resource  
**Date:** 2026-10-01

## 1. Purpose

Place is the canonical spatial/resource hierarchy used by BeatOne. Building, Floor, Unit, and Resource are canonical Place kinds, not competing top-level persistence models.

## 2. Canonical Shape

```ts
interface Place {
  readonly id: Id;
  readonly kind: "PLACE" | "BUILDING" | "FLOOR" | "UNIT" | "RESOURCE";
  readonly parentId?: Id;
}
```

## 3. Hierarchy

```text
PLACE → BUILDING → FLOOR → UNIT → RESOURCE
```

Parent rules:
- PLACE: parent must be absent.
- BUILDING: parent is optional and, when present, must be PLACE.
- FLOOR: parent is required and must be BUILDING.
- UNIT: parent is required and must be FLOOR.
- RESOURCE: parent is required and must be UNIT.

A root BUILDING is permitted because the existing canonical shape makes `parentId` optional and no parent should be fabricated.

## 4. Invariants

1. ID is non-empty and BeatOne-owned.
2. Kind is one of the five canonical values.
3. Parent, when required, exists before creation commits.
4. Parent kind must satisfy the hierarchy above.
5. PLACE cannot have a parent.
6. Duplicate IDs are conflicts.
7. Failed creation publishes no Place record.
8. Place creation does not create Access, Capability, Authorization, Relationship, or Context.
9. Place does not authenticate or authorize anyone.
10. Place does not imply ownership, membership, residence, tenancy, or permission.

## 5. Domain Ownership

Place owns the canonical representation and creation of spatial/resource nodes. It does not own access decisions, relationships, context, capability, authorization, or external device/provider state.

## 6. Persistence

Canonical ownership remains:

```text
places → Place
```

No separate `buildings`, `floors`, `units`, or `resources` tables are introduced.

## 7. Transaction Semantics

```text
validate kind/id/parent
        ↓
validate parent reference and parent kind
        ↓
repository transaction
        ↓
commit
```

## 8. Boundary

Access may reference future/current Place IDs, but Access does not authorize a Place. Place creation does not create authorization.

## 9. Non-Goals

No authentication, credentials, sessions, authorization, capability, relationship, context, provider integration, hardware, production database, migration, or infrastructure work belongs to this layer.

## 10. Implementation Gate

Complete only after canonical creation, persistence reconciliation, focused tests, CI verification, and a fresh bottom-up reconciliation are green.

## 11. Canonical Principle

**One Place model. Five canonical kinds. One persistence owner. No hidden authority.**
