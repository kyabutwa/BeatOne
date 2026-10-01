# BeatOne — People + Communities Contract

**Status:** 🟢 VERIFIED — IMPLEMENTATION CONTRACT  
**Layer:** Foundation-First Stage 3 — People + Communities

## 1. Purpose

This contract defines the canonical People and Communities domain boundary immediately above BeatCore.

It establishes the minimum semantics needed before Identity + Participant.

## 2. Person

A Person represents an individual human subject in BeatOne.

Rules:
- Person has one BeatOne-owned opaque identifier.
- Person existence does not imply Identity, Account, authentication, Participant status, capability, or authorization.
- Person does not itself grant access or authority.
- The People layer does not create credentials or sessions.
- Minimal foundation representation is intentionally identity-neutral and data-minimal.

## 3. Community

A Community represents a voluntarily participating collective context.

Rules:
- Community has one BeatOne-owned opaque identifier.
- Community has a required non-empty display name at this foundation stage.
- Community existence does not imply membership, authority, governance power, or authorization.
- Community does not replace Person, Identity, Participant, or Authorization.

## 4. Ownership

People owns Person creation and canonical Person representation.

Communities owns Community creation and canonical Community representation.

Identity + Participant later owns the relationship between an Identity and participation in a Community.

The People + Communities layer must not invent a second participant or membership model.

## 5. Validation

Required invariants:
- canonical IDs must be non-empty;
- Community name must be non-empty;
- duplicate canonical IDs are conflicts;
- canonical records are persisted through the repository boundary;
- failed transactions do not publish partial People/Community writes.

## 6. Persistence

Canonical persistence remains:
- `persons` owned by Person;
- `communities` owned by Community.

The existing DB-neutral persistence representation already contains these canonical records.

No production schema or migration is introduced by this contract.

## 7. Boundary

The first operations are intentionally narrow:

- create Person;
- create Community.

Both use the repository transaction boundary.

No Identity, Participant, Access, Relationship, Context, Capability, Authorization, GENESIS, payment, provider, or infrastructure semantics are introduced.

## 8. API boundary

Application/API exposure is not required merely to establish the domain contract.

If later exposed, Application/API must delegate to these canonical domain operations rather than reimplementing validation or persistence.

## 9. Tests

The implementation must prove:
1. valid Person creation;
2. valid Community creation;
3. invalid/empty IDs rejected;
4. invalid/empty Community names rejected;
5. duplicate IDs rejected;
6. transaction rollback preserves canonical state;
7. Person creation does not manufacture Identity;
8. Community creation does not manufacture Participant or Authorization.

## 10. Completion gate

**Contract → Implementation → Persistence Reconciliation → Tests → CI Verification → Fresh Reconciliation**

## 11. Explicit non-goals

This layer does not introduce:
- authentication;
- accounts;
- credentials;
- sessions;
- participant membership;
- authorization;
- access control;
- physical places;
- relationships;
- payments;
- external providers;
- production database;
- migrations;
- cloud infrastructure;
- hardware.

## Canonical principle

**A Person is a human subject. A Community is a voluntary collective context. Neither one is authority by itself.**
