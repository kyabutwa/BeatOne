# BeatCore Domain Operations

**Status:** PROPOSED FOR IMPLEMENTATION  
**Scope:** canonical domain operations after persistence/repository verification

## 1. Position in the foundation

The verified sequence is:

Product → Technical → BeatCore Contract → Persistence Representation → Repository Boundary → Domain Operations → API/Application

The domain-operation layer is the next required layer.

It proves that canonical BeatCore objects can be used through a state-changing operation without bypassing authorization, persistence, lifecycle, or event semantics.

## 2. Operation boundary

A canonical consequential local operation follows:

validate → authorize → state transition → persist → event recording → commit

The operation layer owns orchestration of these domain steps.

It does not own:
- HTTP;
- UI behavior;
- database/vendor code;
- authentication-provider behavior;
- external provider execution;
- GENESIS authority;
- payment semantics.

## 3. Authorized action operation

The first executable operation is intentionally narrow:

**Create and persist an authorized Action and its corresponding local Event atomically.**

Inputs include:
- Action identifier;
- actor;
- operation;
- canonical Authorization;
- optional Proposal/Context/Correlation/Idempotency;
- Event identifier/type/source/time/version.

Rules:
1. required input is validated;
2. authorization must be ALLOW and currently valid;
3. the Action is created through the canonical BeatCore operation;
4. Action state is AUTHORIZED;
5. Action is persisted;
6. Event is created only from the canonical Action;
7. Event is persisted in the same local transaction;
8. any failure rolls back the Action and Event together;
9. external operations are not performed by this layer.

## 4. Semantic boundary

This operation does not claim that an external real-world effect has completed.

AUTHORIZED Action → ACTION_AUTHORIZED Event

is a local canonical occurrence.

It must not be represented as:

AUTHORIZED Action → COMPLETED Event

unless a later operation establishes the actual completion according to its domain contract and evidence requirements.

## 5. Idempotency

If an idempotency key is supplied, the repository enforces uniqueness within its consequential-operation scope.

A duplicate key is a conflict at this foundation stage. No second Action or Event may be created.

A future higher-level retry contract may define replay/result retrieval without changing the canonical Action/Event distinction.

## 6. Completion gate

This layer is verified only when tests prove:
- invalid/expired/denied authorization cannot create an Action;
- a valid authorization creates an Action with the required authorization basis;
- the Action and its Event commit together;
- a failure while recording the Event rolls back the Action;
- duplicate idempotency keys do not create duplicate Actions;
- the resulting Event remains distinct from the Action;
- no external provider operation is implied.
