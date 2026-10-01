# Place / Building / Floor / Unit / Resource Fresh Bottom-Up Reconciliation

**Status:** 🟢 VERIFIED — RECONCILIATION COMPLETE  
**Scope:** Place / Building / Floor / Unit / Resource  
**Date:** 2026-10-01

## 1. Reviewed Foundation

Reviewed the frozen Product and Technical Architecture and the implemented layers through Access, including the current canonical Place type, persistence representation, repository validation, Access contract, and Access CI verification.

## 2. Existing Canonical Shape

BeatCore already defines one canonical Place concept:

```ts
interface Place {
  readonly id: Id;
  readonly kind: "PLACE" | "BUILDING" | "FLOOR" | "UNIT" | "RESOURCE";
  readonly parentId?: Id;
}
```

Persistence already has `places` owned by `Place`, with the same fields. The repository validates that an optional `parentId` references an existing Place.

## 3. Current Gap

The canonical data and persistence shape exist, but there is no dedicated Place domain operation or focused contract/test boundary. That is the narrow implementation gap.

## 4. Canonical Hierarchy

```text
PLACE
 └── BUILDING
      └── FLOOR
           └── UNIT
                └── RESOURCE
```

The implementation may represent a root BUILDING where no parent is supplied; it must not invent a parent merely to satisfy the model. When a parent is supplied, the implementation validates the parent-kind relationship.

## 5. Parent Semantics

- PLACE: no parent; a supplied parent is rejected.
- BUILDING: optional parent of kind PLACE.
- FLOOR: required parent of kind BUILDING.
- UNIT: required parent of kind FLOOR.
- RESOURCE: required parent of kind UNIT.

This keeps the hierarchy explicit without introducing separate competing Building/Floor/Unit/Resource persistence models.

## 6. Non-Goals

This layer does not implement access authorization, capabilities, relationships, context, authentication, credentials/sessions, access controllers, QR/NFC/biometrics, provider integrations, production database, migration, or infrastructure.

## 7. Controlled Sequence

**Fresh Reconciliation → Place Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Reconciliation**

## 8. Result

**🟢 VERIFIED — PLACE / BUILDING / FLOOR / UNIT / RESOURCE IS THE CORRECT NEXT IMPLEMENTATION LAYER.**
