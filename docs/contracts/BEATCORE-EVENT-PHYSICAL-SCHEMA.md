# BeatCore Event Physical Schema Contract

**Status:** 🔵 PROPOSED — PHYSICAL TARGET FOR REVIEW
**Date:** 2026-10-02
**Scope:** Canonical Event physical representation only

## 1. Canonical target

The physical `public.events` representation SHALL implement the verified Event contract without changing Event meaning.

| Column | Type | Nullability |
|---|---|---|
| id | text | NOT NULL, PK |
| action_id | text | NULL |
| type | text | NOT NULL |
| occurred_at | timestamptz | NOT NULL |
| state | varchar(32) | NOT NULL |
| actor_id | text | NULL |
| context_id | text | NULL |
| source | text | NOT NULL |
| correlation_id | text | NULL |
| causation_id | text | NULL |
| version | bigint | NOT NULL, default 1 |

## 2. Integrity

- `id` is the canonical Event identity.
- `action_id`, when present, references canonical `actions.id`.
- `actor_id`, when present, references canonical `identities.id`.
- `context_id`, when present, references canonical `contexts.id`.
- `state` is restricted to the canonical BeatCore lifecycle set.
- `type` and `source` are non-blank.
- `occurred_at` is required.
- `version >= 1`.
- When `action_id` is present, database/application enforcement must preserve Event.state = Action.state and Event actor/context consistency.
- `correlation_id` and `causation_id` remain trace metadata.
- No Event constraint may imply real-world completion.

## 3. Legacy disposition

Current production `events` contains zero rows.

Legacy columns `title`, `participant_id`, `authorization_id`, `status`, and `metadata` MUST NOT receive silently invented meanings.

Because there are no rows, a future canonicalization may remove or retain legacy compatibility columns only after dependency inspection and explicit migration approval. This contract does not choose drop/retain behavior.

## 4. Required indexes

At minimum, justify indexes for:
- primary key `id`;
- `action_id`;
- `actor_id`;
- `context_id`;
- `correlation_id`;
- `occurred_at` where workload requires it.

## 5. Transaction boundary

For Action-caused events, Event persistence belongs to the same local transaction as the Action operation.

Standalone Events remain permitted only where a domain contract explicitly requires them.

External provider outcomes must not be translated into completed Event state merely because a provider acknowledged a request.
