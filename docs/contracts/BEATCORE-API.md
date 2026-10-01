# BeatOne — Application/API Boundary Reconciliation

**Date:** 2026-10-01  
**Repository:** kyabutwa/BeatOne  
**Branch:** main  
**Scope:** Application/API boundary before implementation  
**Status:** 🟢 VERIFIED — RECONCILIATION COMPLETE

## 1. Review target

The verified foundation was reviewed bottom-up before introducing an application/API layer:

Product Architecture → Technical Architecture → BeatCore Contract → BeatCore implementation → Persistence Representation → Repository Boundary → Domain Operations → API/Application boundary.

## 2. Findings

### Canonical product meaning
🟢 No competing product meaning was introduced by the current implementation.

### Domain ownership
🟢 BeatCore owns canonical entities and invariants.

### Persistence
🟢 The repository boundary is the only current persistence interface. No database vendor, migration, or direct DB write exists.

### Domain operations
🟢 Consequential local execution is centralized in executeAuthorizedAction and follows validation → authorization → state transition → persistence → event recording → commit.

### API boundary
🔵 Not yet implemented at review start.

The technical architecture requires the API to expose authorized access to commands, queries, lifecycle state, events/evidence where permitted, while remaining a boundary rather than a second domain model.

### Critical invariant found and repaired before API implementation
🔴/🟡 A domain invariant gap was found: createAction validated the supplied Authorization but did not require Action.actorId to equal Authorization.actorId.

That would have allowed an action to be attributed to one actor while using another actor's authorization basis.

This was repaired at the canonical BeatCore layer—not in the API—because the API must not compensate for a lower-layer contract violation.

Repair:
- BeatCore contract records Action.actorId === Authorization.actorId.
- BeatCore implementation rejects mismatch with UNAUTHORIZED.
- BeatCore tests verify the invariant.

## 3. API boundary rules

The application/API layer must:

1. accept transport/application input without redefining domain meaning;
2. require a trusted server-side authorization context for protected commands;
3. never treat client-supplied identity or authority as sufficient authorization;
4. delegate consequential execution to canonical domain operations;
5. expose canonical lifecycle state without inventing UI-only success states;
6. preserve UNKNOWN, PENDING, FAILED, UNAUTHORIZED, CONFLICT, and other meaningful outcomes;
7. keep Action, Event, and Evidence distinct;
8. provide correlation/request metadata without turning it into business identity;
9. perform no direct persistence writes outside the repository/domain-operation boundary;
10. perform no external provider operation in this foundation layer;
11. remain framework, HTTP, database, auth-provider, payment-provider, and frontend-library independent;
12. avoid creating a second application-owned identity, participant, authorization, lifecycle, event, or evidence model.

## 4. Explicit non-goals

This layer does not introduce:
- HTTP framework or server;
- authentication provider;
- session implementation;
- authorization policy engine;
- database vendor;
- SQL or migrations;
- frontend;
- external integrations;
- GENESIS;
- production deployment.

## 5. Required implementation sequence

Contract → implementation → tests → CI verification.

The first executable API boundary is intentionally narrow:

Authorized application command → canonical domain operation → application response

A read boundary may expose a committed canonical Action by ID without creating a competing read model.

## 6. Completion gate

The application/API boundary is complete for this foundation stage only when tests prove:

- valid authorized application command delegates to canonical domain execution;
- actor/authorization mismatch cannot bypass BeatCore;
- denied/expired authorization remains a domain error;
- Action/Event remain distinct in the response;
- duplicate idempotency remains a conflict;
- event failure remains atomic through the domain repository transaction;
- committed Action reads are returned without mutation;
- missing Action reads return NOT_FOUND;
- the API layer performs no direct persistence mutation;
- no external operation is implied;
- CI passes.

## 7. Gate

🟢 VERIFIED — API BOUNDARY RECONCILIATION COMPLETE.

Proceed only to the narrow application/API contract and implementation defined above. Do not introduce HTTP, database, authentication provider, frontend, or external integration merely because the boundary now exists.