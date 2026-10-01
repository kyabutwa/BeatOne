# BeatCore Access Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT  
**Scope:** Access  
**Date:** 2026-10-01

## 1. Purpose

Access represents a canonical interaction/request by a Participant with an ecosystem-controlled target.

Access establishes the interaction record. It does not establish permission.

## 2. Canonical Shape

```ts
interface Access {
  readonly id: Id;
  readonly participantId: Id;
  readonly targetType:
    | "place" | "building" | "floor" | "unit" | "resource" | "service" | "digital";
  readonly targetId: Id;
  readonly mode:
    | "physical" | "digital" | "service" | "resource" | "contextual" | "temporary" | "delegated";
}
```

## 3. Meaning

Access identifies who is participating, what controlled target is involved, the target category, and the access mode.

## 4. Invariants

1. Access has one BeatOne-owned opaque ID.
2. `participantId` must reference an existing Participant.
3. `targetId` must be non-empty.
4. `targetType` and `mode` must use the canonical values above.
5. Duplicate Access IDs are conflicts.
6. Access creation does not grant permission.
7. Access creation does not create Authorization.
8. Access creation does not create Capability.
9. Access creation does not authenticate the Participant.
10. Access does not manufacture a target record.
11. Later target domains validate their own target semantics.

## 5. Authentication Boundary

PIN, QR, NFC, wearable, fingerprint, face, palm, device authentication, and other mechanisms are implementation choices outside this contract. Authentication factors do not themselves grant authority.

## 6. Authorization Boundary

Access is not Authorization. This contract contains no authorization decision, capability, policy, scope, delegation authority, approval, or enforcement decision.

## 7. Place Boundary

Access may refer to future Place/Building/Floor/Unit/Resource targets through `targetType` + `targetId`. The Access layer must not manufacture those records.

## 8. Persistence

Canonical persistence ownership is:

```text
accesses → Access
```

No existing canonical table is reused as a competing owner. The schema remains DB-neutral.

## 9. Transaction Semantics

```text
validate input
    ↓
validate Participant reference
    ↓
persist through repository transaction
    ↓
commit
```

Failed creation publishes no Access record.

## 10. Domain Ownership

Access owns its canonical representation, creation, and input invariants. It does not own Identity, Participant, Place, Relationship, Context, Capability, Authorization, Action, Event, Evidence, authentication providers, or external access controllers.

## 11. Security Principle

```text
Identity ≠ Participant ≠ Access ≠ Capability ≠ Authorization
```

Access is an interaction boundary, not an authority shortcut.

## 12. Implementation Gate

Complete only after the Access type, repository creation operation, Participant reference enforcement, persistence reconciliation, tests, CI, and fresh reconciliation are verified.

## 13. Canonical Principle

**Access records controlled interaction. Authorization determines permission.**
