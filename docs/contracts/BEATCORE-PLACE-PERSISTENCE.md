# BeatCore Place Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED  
**Scope:** Place / Building / Floor / Unit / Resource  
**Date:** 2026-10-01

## 1. Persistence Decision

No new persistence table is required. The canonical `places` owner already existed before this layer:

```text
places → Place
```

The Place layer therefore reconciles and strengthens the existing DB-neutral representation rather than creating competing `buildings`, `floors`, `units`, or `resources` tables.

## 2. Stored Representation

```ts
interface StoredPlace {
  readonly id: Id;
  readonly kind: "PLACE" | "BUILDING" | "FLOOR" | "UNIT" | "RESOURCE";
  readonly parentId?: Id;
}
```

## 3. Repository Enforcement

The repository now enforces:

- non-empty Place ID;
- unique Place ID;
- parent existence when supplied;
- PLACE has no parent;
- BUILDING parent, when supplied, is PLACE;
- FLOOR parent is BUILDING;
- UNIT parent is FLOOR;
- RESOURCE parent is UNIT;
- required parent for FLOOR, UNIT, and RESOURCE;
- self-parent rejection.

## 4. Transaction Boundary

Place creation validates the parent inside the repository transaction before publishing the record. Failed creation publishes no partial Place state.

## 5. Authority Boundary

Persistence does not create Access, Capability, Authorization, Relationship, or Context. A Place is not permission, ownership, membership, tenancy, or residence.

## 6. Migration Decision

No production migration was introduced. No physical database schema was changed.

If a physical production schema is introduced later, it remains subject to the existing migration safety sequence:

Contract Review → Schema Review → Application Compatibility → Migration Test → Rollback/Recovery → Non-prod Verification → Production Approval → Production Verification.

## 7. Result

**🟢 VERIFIED — EXISTING PLACE PERSISTENCE IS SUFFICIENT, CANONICAL, AND RECONCILED.**
