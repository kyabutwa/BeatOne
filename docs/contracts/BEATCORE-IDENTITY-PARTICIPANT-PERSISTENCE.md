# Identity + Participant Persistence Reconciliation

**Status:** 🟢 VERIFIED — RECONCILED  
**Scope:** Identity + Participant  
**Date:** 2026-10-01

## 1. Persistence Review

The existing canonical persistence representation was reviewed against the Identity + Participant contract.

Existing tables:

- `identities`
- `participants`

No additional persistence entity is required.

## 2. Identity Representation

Existing representation:

```ts
interface StoredIdentity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
  readonly personId?: Id;
}
```

This is sufficient for the current Identity contract.

The repository already enforces:

- non-empty canonical ID;
- optional `personId` reference must resolve to an existing Person;
- duplicate Identity IDs are rejected as conflicts;
- transaction rollback prevents partial publication.

No new column or table is required.

## 3. Participant Representation

Existing representation:

```ts
interface StoredParticipant {
  readonly id: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}
```

This is sufficient for the current Participant contract.

The repository already enforces:

- non-empty canonical ID;
- required `identityId` reference to an existing Identity;
- optional `communityId` reference to an existing Community;
- optional `contextId` reference to an existing Context;
- duplicate Participant IDs are rejected as conflicts;
- transaction rollback prevents partial publication.

## 4. Dependency Ordering

The existing repository dependency checks are compatible with the frozen architecture:

```text
Person
  ↓
Identity
  ↓
Participant
  ↓
Context / Community references
```

Participant does not create Context.

This prevents the Identity + Participant layer from prematurely implementing the later Context layer.

## 5. No Persistence Redesign

This reconciliation requires:

- no new table;
- no table rename;
- no schema migration;
- no production database operation;
- no ORM;
- no database vendor;
- no external identity store.

The current DB-neutral persistence representation remains canonical.

## 6. Transaction Boundary

Identity and Participant creation each use the existing repository transaction boundary.

Therefore:

```text
validate
  ↓
repository transaction
  ↓
reference validation
  ↓
persist
  ↓
commit
```

A failed reference or duplicate conflict cannot publish the attempted record.

## 7. Security / Authority

Persistence does not convert Identity or Participant existence into:

- authentication;
- Account status;
- Credential validity;
- Session validity;
- Capability;
- Authorization.

Those remain separate canonical concepts.

## 8. Result

**🟢 VERIFIED — EXISTING PERSISTENCE REPRESENTATION IS SUFFICIENT.**

The Identity + Participant layer requires no persistence redesign or migration.

Next controlled step: **Tests → CI → Fresh Reconciliation**.
