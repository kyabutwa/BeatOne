# BeatCore Identity + Participant Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT  
**Scope:** Identity + Participant  
**Date:** 2026-10-01

## 1. Purpose

This contract defines the canonical Identity and Participant domain boundary immediately above People + Communities and below Access, Context, Relationship, Capability, and Authorization.

It implements existing BeatCore meaning. It does not introduce a second identity or participation model.

## 2. Identity

Identity represents the canonical actor identity recognized by BeatOne.

Identity answers:

> who or what is participating?

Canonical shape:

```ts
interface Identity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
  readonly personId?: Id;
}
```

Rules:

1. Identity has one BeatOne-owned opaque ID.
2. `kind` is required and must be one of the four canonical kinds.
3. `personId`, when present, must reference an existing Person.
4. A human Identity may be associated with a Person through `personId`.
5. Non-human Identity kinds may exist without a Person.
6. Identity existence does not create an Account.
7. Identity existence does not create Credentials.
8. Identity existence does not create a Session.
9. Identity existence does not create Participant status automatically.
10. Identity existence does not grant Capability or Authorization.
11. Authentication remains separate from Identity semantics.

## 3. Participant

Participant represents an Identity participating in a specific BeatOne context.

Canonical shape:

```ts
interface Participant {
  readonly id: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}
```

Rules:

1. Participant has one BeatOne-owned opaque ID.
2. `identityId` is required and must reference an existing Identity.
3. `communityId`, when present, must reference an existing Community.
4. `contextId`, when present, must reference an existing Context.
5. This layer does not create Context records.
6. This layer does not infer Relationship, Capability, or Authorization.
7. Participant is first-class and is not replaced by Account, Session, or a UI profile.
8. The same Identity may have multiple Participants when distinct participation contexts require them.
9. Participant existence does not grant unrestricted authority.
10. Community association is participation context, not automatic authorization.

## 4. Person → Identity → Participant

The canonical foundation is:

```text
Person
  ↓ optional association
Identity
  ↓ participation
Participant
  ↓ optional context/community references
Community / Context
```

This does not collapse the concepts.

A Person is the human subject.

An Identity is the canonical actor representation.

A Participant is the contextual participation record.

## 5. Domain Ownership

Identity + Participant owns:

- Identity creation;
- Participant creation;
- canonical validation of their required references;
- canonical representation returned from these operations.

It does not own:

- authentication;
- Accounts;
- Credentials;
- Sessions;
- Access;
- Context;
- Relationship;
- Capability;
- Authorization;
- Intent;
- Proposal;
- Action;
- Event;
- Evidence;
- external provider identity;
- production infrastructure.

## 6. Persistence

Existing canonical tables remain authoritative:

- `identities` → Identity
- `participants` → Participant

No new tables are required.

No migration is required.

The repository remains the only persistence boundary.

## 7. Transaction Semantics

Creation follows:

```text
validate input
    ↓
validate required references
    ↓
persist through repository transaction
    ↓
commit
```

A failed transaction must publish no partial Identity or Participant record.

Duplicate IDs are conflicts.

## 8. Security Boundary

This layer does not authenticate an actor.

It does not establish business authorization.

It does not treat possession of an Identity ID or Participant ID as authority.

Authorization is a later canonical layer.

## 9. External Systems

External identifiers, authentication providers, identity providers, payment providers, and other external systems are not introduced here.

No external system may redefine BeatOne Identity or Participant semantics.

## 10. Implementation Gate

Implementation is complete only when:

1. canonical creation operations exist;
2. required references are enforced through the repository;
3. no authentication/provider behavior is introduced;
4. no authorization behavior is introduced;
5. tests prove positive and negative cases;
6. CI passes;
7. persistence reconciliation confirms no schema redesign is required;
8. a fresh bottom-up reconciliation confirms the next layer.

## 11. Canonical Principle

```text
Person ≠ Identity ≠ Participant
Identity ≠ Authentication
Authentication ≠ Authorization
Participant ≠ Authorization
```

This contract preserves the permanent BeatOne foundation.
