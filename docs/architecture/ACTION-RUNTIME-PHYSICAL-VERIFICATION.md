# Action Runtime Physical Verification — Disposable Neon

Status: 🟢 VERIFIED — RUNTIME PHYSICAL PATH EXERCISED WITH CONTROLLED NON-PRODUCTION GRAPH

Date: 2026-10-02

## Disposable target

Neon project: Zalagren
Production parent: br-frosty-poetry-b5tv56g1
Disposable branch: action-runtime-verify-2026-10-02-r2
Disposable branch ID: br-shy-queen-b5yb1y9v

The branch was cloned from production and was used only for this rehearsal.

## Controlled graph

Minimum disposable graph created:

identity → participant → context → intent → proposal → capability/service → authorization → Action → action_execution

The parent production rows were reused only for an existing active identity/participant. All domain graph rows created for the rehearsal used dedicated `runtime-rehearsal` identifiers.

## Results

### Valid Action

A canonical Action was inserted with:

- actor_id = existing active identity
- proposal_id = controlled proposal
- authorization_id = controlled active authorization
- state = AUTHORIZED
- operation = execute
- context_id = controlled context
- correlation_id and idempotency_key supplied
- version = 1

Insert succeeded.

### Action execution linkage

A corresponding `action_executions` row was inserted referencing:

- action_id
- proposal_id
- authorization_id

The live physical FK `action_executions.action_id → actions.id` accepted the canonical Action and the resulting link was verified.

### Idempotency

A second Action insert using the existing Action idempotency key was rejected by:

`actions_idempotency_key_uq`

The rejected duplicate did not persist.

### Version/concurrency

The canonical Action was conditionally advanced:

`version 1 → version 2`

A subsequent stale compare-and-swap update using `WHERE version = 1` matched no row, leaving the committed Action at:

- state = PROCESSING
- version = 2

This verifies the required optimistic-concurrency pattern at the physical persistence boundary.

### Actor/authorization integrity

A deliberately mismatched actor identity with the existing authorization was accepted by PostgreSQL because both IDs individually satisfy their FKs.

This is **not treated as a passing authorization result**.

It confirms the established contract boundary:

- FK existence is database-enforced;
- actor_id ↔ authorization.actor identity equality is a domain/application invariant and must be enforced by the canonical authorization/action write path.

No migration change is authorized from this observation.

## Gate

- 🟢 valid canonical Action persistence
- 🟢 Action → action_execution physical linkage
- 🟢 DB-enforced Action idempotency
- 🟢 version compare-and-swap behavior
- 🟡 actor ↔ authorization semantic equality requires application-layer enforcement; database alone does not enforce it

The controlled graph and Action rows existed only on the disposable branch.

Production was not mutated.

## Next stage

🔵 PAYMENTS MIGRATION DESIGN + NON-PRODUCTION REHEARSAL

Before Payments migration execution, the Payments migration must preserve the established Action linkage and the same authorization boundary; no production execution is authorized by this verification.
