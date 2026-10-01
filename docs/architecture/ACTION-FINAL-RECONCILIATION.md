# Action Final Fresh Reconciliation

**Status:** 🟢 VERIFIED — IMPLEMENTED, CI VERIFIED, FRESHLY RECONCILED
**Date:** 2026-10-01

## Completed sequence

Fresh Reconciliation → Action Contract → Implementation Audit/Repair → Persistence Reconciliation → Dedicated Tests → CI → Final Fresh Reconciliation.

## Full-system position

All foundation layers below Action remain reconciled and green:
BeatCore → People + Communities → Identity + Participant → Access → Place / Building / Floor / Unit / Resource → Relationship + Context → Capability + Authorization → Intent + Proposal.

## Verified Action boundary

Action is the canonical record of an authorized operation.

Verified invariants:
- Action requires an existing Authorization;
- the persisted Authorization is the authority source;
- persisted Authorization must be ALLOW and valid at the operation time;
- Action actor equals persisted Authorization actor;
- caller-supplied Authorization data cannot override the persisted decision/validity;
- optional Proposal exists and belongs to the same actor;
- optional Context exists;
- operation is non-empty;
- idempotency keys are unique;
- duplicate Action IDs conflict;
- lifecycle transitions remain governed by the canonical BeatCore transition matrix;
- Action is distinct from Event and Evidence;
- AUTHORIZED does not mean real-world completion.

## Implementation

The dedicated Action entry point delegates to the canonical authorized-action domain operation.

The operation now loads the persisted Authorization inside the same repository transaction before creating the Action. This prevents a caller-supplied Authorization object from manufacturing authority while reusing an existing Authorization ID.

The operation continues to create:

`AUTHORIZED Action → ACTION_AUTHORIZED Event`

as a local canonical occurrence.

## Persistence

`actions` is the canonical persistence owner for Action.

Existing DB-neutral persistence representation remains sufficient.

Repository invariants enforce:
- canonical Identity reference;
- canonical Authorization reference;
- Authorization/Action actor consistency;
- Proposal existence and actor consistency;
- Context existence;
- non-empty operation;
- idempotency uniqueness.

## Test and CI verification

Intermediate CI failures were real findings caused by tests still treating the caller-supplied Authorization object as authoritative. Those tests were corrected to mutate the persisted Authorization and verify the new canonical rule.

Final verification:
- **Run #119 — `36901737898` — 🟢 success**
- Typecheck — 🟢 success
- npm test — 🟢 success

## Explicit non-goals

No Event redesign, Evidence implementation, GENESIS, external provider, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.

## Final gate

**🟢 VERIFIED — ACTION FOUNDATION COMPLETE.**

### Next exact layer

**EVENT**

Continue with the same review-first discipline:
Fresh Reconciliation → Event Contract → Implementation → Persistence Reconciliation → Tests → CI → Fresh Fresh Reconciliation.
