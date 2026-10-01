# BeatCore Evidence Physical Schema Contract

**Status:** 🔵 PROPOSED — PHYSICAL TARGET FOR REVIEW
**Date:** 2026-10-02
**Scope:** Canonical Evidence physical representation only

## 1. Canonical target

The physical `public.evidence` representation SHALL implement the verified Evidence contract.

| Column | Type | Nullability |
|---|---|---|
| id | text | NOT NULL, PK |
| event_id | text | NULL |
| source | text | NOT NULL |
| verification | varchar(16) | NOT NULL |
| recorded_at | timestamptz | NOT NULL |
| external_provider | text | NULL |
| external_reference | text | NULL |

## 2. Integrity

- `id` is canonical Evidence identity.
- `event_id`, when present, references canonical `events.id`.
- `source` is non-blank.
- `verification` is exactly `UNVERIFIED | VERIFIED | REJECTED`.
- `recorded_at` is required.
- `external_provider` and `external_reference` are atomic: both present or both absent.
- Provider/reference values remain secondary metadata and never become Evidence identity.
- Creation defaults to UNVERIFIED at the application contract; physical schema must not silently upgrade verification.

## 3. Legacy disposition

Current production `evidence` contains zero rows.

Legacy `statement`, `status`, `source`, and `observed_at` MUST NOT be silently remapped to canonical Evidence fields without an explicit semantic decision.

The existing `event_evidence` many-to-many bridge also contains zero rows. It cannot become canonical Evidence identity. Its retain/drop disposition requires dependency verification and explicit migration approval.

## 4. Required indexes

At minimum, justify indexes for:
- primary key `id`;
- `event_id`;
- `verification`;
- provider/reference where integration contracts require lookup.

## 5. Verification boundary

Evidence records support or qualify claims; existence of a row does not prove a real-world claim.

GENESIS may consume Evidence but cannot manufacture verification.
