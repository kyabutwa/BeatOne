# BeatCore Evidence Physical PostgreSQL Schema Contract

**Status:** APPROVED DESIGN CONTRACT
**Date:** 2026-10-02

`public.evidence` is the canonical physical Evidence table.

Required columns: `id`, `event_id?`, `source`, `verification`, `recorded_at`, `external_provider?`, `external_reference?`.

Database invariants:
- id is the primary key;
- source is non-blank;
- verification is exactly `UNVERIFIED`, `VERIFIED`, or `REJECTED`;
- optional Event reference resolves;
- provider/reference are both present or both absent;
- supplied provider/reference values are non-blank.

Evidence remains separate from Event, Action, and Authorization. Persistence or verification does not itself establish real-world completion.

Legacy `statement`, `status`, and `observed_at` belong to the older claim representation and may be removed only after the zero-row/dependency gate passes.

`public.event_evidence` is not canonical Evidence identity. It is retired only when its row count is proven zero.
