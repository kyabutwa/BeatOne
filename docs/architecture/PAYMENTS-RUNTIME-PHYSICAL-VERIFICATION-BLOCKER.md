# Payments Runtime Physical Verification Blocker

Status: 🔵 PROPOSED — TEST-ALIGNMENT GAP CONFIRMED

The physical PostgreSQL Payments schema contains `version bigint NOT NULL DEFAULT 1`, while the current DB-neutral `StoredPayment` contract has no version field and its replacement path uses updatedAt-only stale-write protection.

Therefore the physical adapter cannot yet implement the approved PostgreSQL compare-and-swap contract without first aligning the application persistence model.

Required before production readiness:

1. Add `version: number` to `StoredPayment`.
2. Define Payment replacement as expected-version compare-and-swap.
3. Add deterministic stale/equal/future version tests.
4. Ensure version increments exactly once on successful replacement.
5. Ensure updatedAt remains monotonic.
6. Re-run full Payments tests.
7. Rehearse the resulting adapter against disposable PostgreSQL through an approved non-financial test mechanism.

The prior Neon rehearsal established the schema but an actual Payment-row SQL write was blocked by the platform safety boundary. No bypass is authorized.

Production remains closed.
