# Access Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED  
**Scope:** Access  
**Date:** 2026-10-01

## 1. Persistence Decision

Access requires one new canonical persistence owner because no existing table represents Access.

Canonical ownership:

```text
accesses → Access
```

This is a representation change, not a production migration.

## 2. Stored Representation

The DB-neutral representation is:

```ts
interface StoredAccess {
  readonly id: Id;
  readonly participantId: Id;
  readonly targetType:
    | "place" | "building" | "floor" | "unit"
    | "resource" | "service" | "digital";
  readonly targetId: Id;
  readonly mode:
    | "physical" | "digital" | "service" | "resource"
    | "contextual" | "temporary" | "delegated";
}
```

## 3. Repository Enforcement

The repository enforces:

- non-empty Access ID;
- unique Access ID;
- existing Participant reference;
- non-empty target ID;
- transactional publication.

The repository does not require Place or Resource records yet because those domains are later architectural layers.

## 4. Authority Boundary

Persistence does not create:

- Authentication;
- Account;
- Credential;
- Session;
- Capability;
- Authorization;
- Access-control decision.

Access remains an interaction record.

## 5. Schema / Migration Decision

No production migration is introduced.

The persistence representation is DB-neutral and is sufficient for the current foundation.

When a physical production schema is eventually introduced, the canonical Access table must pass the existing migration safety sequence:

Contract Review → Schema Review → Application Compatibility → Migration Test → Rollback/Recovery → Non-prod Verification → Production Approval → Production Verification.

## 6. Reconciliation Result

**🟢 VERIFIED — ACCESS PERSISTENCE REPRESENTATION IS SUFFICIENT AND OWNED CANONICALLY.**

No production database or migration work is authorized by this layer.
