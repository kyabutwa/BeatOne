# BeatCore Event Physical PostgreSQL Schema Contract

**Status:** APPROVED DESIGN CONTRACT
**Date:** 2026-10-02

`public.events` is the canonical physical Event table.

Required columns: `id`, `action_id?`, `type`, `occurred_at`, `state`, `actor_id?`, `context_id?`, `source`, `correlation_id?`, `causation_id?`, `version`.

Database invariants:
- id is the primary key;
- type/source are non-blank;
- state is exactly a canonical LifecycleState;
- version is >= 1;
- optional Action, Identity, and Context references resolve;
- correlation/causation identifiers are non-blank when supplied.

`events.action_id` is the canonical Action relationship. Action/Event semantic equality (state, actor, context) remains an application invariant; PostgreSQL foreign keys alone cannot establish equality between independent rows.

Legacy `title`, `participant_id`, `authorization_id`, `status`, and `metadata` are not aliases for canonical fields. They may be removed only after proving the live table is empty and no producer depends on them.

No Event schema may grant authorization, manufacture Evidence, or claim external completion.
