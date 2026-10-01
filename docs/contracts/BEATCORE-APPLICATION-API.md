# BeatOne — Application/API Contract

**Status:** PROPOSED FOR IMPLEMENTATION
**Scope:** framework-neutral application/API boundary

## 1. Purpose

This contract defines the boundary between transport/application callers and canonical BeatCore domain operations.

The boundary is not a second domain model. It translates application requests to canonical operations and exposes canonical results.

## 2. Dependency direction

Application/API → BeatCore Domain Operations → Repository Boundary → Persistence Representation

Application/API must not bypass the domain-operation boundary for consequential writes.

## 3. Protected command contract

The first command is an authorized consequential local operation.

Required request data:
- requestId;
- actionId;
- eventId;
- actorId;
- operation;
- trusted server-side Authorization;
- event type;
- event source;
- occurrence time.

Optional data:
- proposalId;
- contextId;
- correlationId;
- idempotencyKey;
- eventVersion.

The Authorization supplied to this boundary represents a trusted server-side authorization result. A future HTTP/client transport must never treat an arbitrary client-supplied Authorization object as authoritative.

## 4. Command semantics

The application boundary delegates to the canonical authorized-action domain operation.

It does not:
- grant authorization;
- manufacture identity;
- execute external providers;
- write persistence directly;
- convert proposals into actions;
- convert actions into completed real-world events;
- fabricate evidence.

## 5. Response semantics

A successful command returns:
- canonical Action;
- canonical Event;
- request/correlation metadata where applicable.

The response preserves canonical lifecycle semantics. AUTHORIZED is not represented as COMPLETED merely because the local command was accepted.

## 6. Query contract

The first query reads a committed canonical Action by ID.

Rules:
- reads do not mutate state;
- the repository remains the canonical source;
- missing Action returns NOT_FOUND;
- no competing read model is introduced.

## 7. Error semantics

Canonical domain errors are preserved, including:
- INVALID_INPUT;
- UNAUTHORIZED;
- EXPIRED;
- NOT_FOUND;
- CONFLICT;
- VALIDATION_FAILURE;
- other defined foundation errors.

The application layer may classify errors for a future transport, but must not change their business meaning.

## 8. Security boundary

Authentication and authorization remain distinct.

The application/API boundary is not itself an authentication provider or policy engine. It consumes trusted authorization context and delegates consequential execution to BeatCore.

Server-side enforcement remains authoritative.

## 9. Non-goals

This contract does not select:
- HTTP framework;
- RPC framework;
- authentication provider;
- authorization provider;
- database;
- ORM;
- frontend framework;
- external integration;
- deployment provider.

## 10. Completion gate

Contract → Implementation → Tests → CI.

The boundary is complete for this stage only when its tests prove delegation, canonical result semantics, preserved domain failures, read-only query behavior, and absence of direct persistence/external operations.