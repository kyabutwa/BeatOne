# BeatCore ActionExecution and ActionOutcomeTrace Contract

**Status:** 🟡 IMPLEMENTED — CI VERIFICATION PENDING
**Scope:** DB-neutral ActionExecution and execution-outcome trace software layer.

## 1. Canonical topology

The consequential execution chain is:

**Proposal → Authorization → Action → ActionExecution → Event → Evidence**

ActionOutcomeTrace links one execution to the Event and Evidence that describe its recorded outcome:

**ActionExecution → ActionOutcomeTrace → Event + Evidence**

ActionExecution is an execution record, not a second Action and not an authorization boundary.

## 2. ActionExecution

Canonical fields:

- id
- actionId
- proposalId
- authorizationId
- status
- providerReference?
- startedAt
- finishedAt?
- result?
- idempotencyKey

Statuses:
- started
- succeeded
- failed
- cancelled

Lifecycle:
- creation starts in started;
- started has no finishedAt;
- terminal states require finishedAt;
- terminal states cannot transition to another state;
- finishedAt cannot precede startedAt.

The software contract requires a Proposal because the current physical execution boundary requires proposal_id NOT NULL.

## 3. Authority continuity

For every ActionExecution:
- actionId → Action.id;
- proposalId → Action.proposalId;
- authorizationId → Action.authorizationId;
- Proposal actor equals Action actor;
- Authorization actor equals Action actor.

Execution MUST NOT replace or silently change the Action's authority.

## 4. Idempotency

ActionExecution requires a non-blank idempotencyKey.
The repository rejects reuse of an existing key for a different execution.

## 5. ActionOutcomeTrace

Canonical fields:
- executionId
- eventId
- evidenceId
- createdAt

executionId is the physical primary key.

Invariants:
- execution exists;
- Event exists;
- Evidence exists;
- Event belongs to the same Action as the execution;
- Evidence is linked to that Event;
- no second Action can be introduced through the trace.

## 6. Runtime behavior

executeAuthorizedAction now atomically records:
1. Action;
2. ActionExecution (started);
3. Event for the Action occurrence;
4. Evidence with UNVERIFIED verification;
5. ActionOutcomeTrace.

The operation does not mark Evidence VERIFIED and does not claim real-world completion.
All five records are committed or rolled back together through the repository transaction.

## 7. Physical boundary

This contract does not alter Neon production.
The existing production tables remain the physical source to be reconciled separately:
- action_executions
- action_outcome_trace
- events
- evidence

The eventual Event/Evidence migration remains blocked until this software layer passes CI and the live dependency graph is freshly reconciled.

## 8. Verification gate

Required before Event/Evidence migration design:
- TypeScript typecheck;
- BeatCore unit tests;
- PostgreSQL ActionExecution/Event/Evidence runtime fixtures;
- cross-chain invariant tests;
- rollback tests;
- fresh production dependency review.

**Production Event/Evidence mutation: CLOSED.**