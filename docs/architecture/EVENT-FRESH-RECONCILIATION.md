# Event Fresh Bottom-Up Reconciliation

**Status:** 🟢 VERIFIED — REVIEW COMPLETE, IMPLEMENTATION GAP IDENTIFIED
**Date:** 2026-10-01

## Scope

Reviewed the canonical foundation from Product Architecture through Action, then audited Event type semantics, `createEvent()`, repository persistence validation, existing Action/Event atomic operation, and current tests.

## Existing Event foundation

Already present:
- canonical `Event` type;
- `events` persistence owner;
- Action → Event linkage;
- event type/source/occurredAt/version;
- optional actor/context/correlation/causation;
- repository reference validation;
- atomic Action + local Event recording;
- existing Action/Event separation tests.

## Gap found

The current Event constructor validates required fields and blocks FAILED/DENIED events, but it does not fully enforce the canonical distinction between an Event occurrence and an Action state.

In particular, an Event linked to an Action can currently be constructed with a state that does not match the Action snapshot. That permits a direct `AUTHORIZED Action → COMPLETED Event` construction without an intervening Action lifecycle transition.

The Event layer therefore requires a dedicated contract and invariant boundary before Event can be considered complete.

## Canonical Event boundary

An Event is a canonical recorded occurrence.

- Event ≠ Action.
- Event ≠ Evidence.
- Event does not grant authorization.
- Event does not manufacture completion.
- An Event linked to an Action must reference an existing Action.
- A linked Event state must represent the Action state at the occurrence being recorded.
- A linked Event actor, when present, must agree with the Action actor.
- A linked Event context, when present, must agree with the Action context.
- `occurredAt` must be a valid timestamp.
- version must be a positive integer.
- external references remain secondary metadata.
- real-world completion remains evidence-dependent where required.

## Controlled execution

Fresh Reconciliation → Event Contract → Implementation Audit/Repair → Persistence Reconciliation → Dedicated Tests → CI → Final Fresh Reconciliation.

## Explicit non-goals

No Evidence implementation, GENESIS, external provider, authentication provider, migration, production database, infrastructure, OneApp, Website, or higher-domain implementation.

**Next controlled action: formalize and repair only the Event boundary identified above.**
