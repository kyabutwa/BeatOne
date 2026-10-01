# Payments Final Reconciliation — 2026-10-02 (Runtime Alignment Update)

Status: 🟡 SUPPORTED — APPLICATION VERSION/CAS ALIGNMENT VERIFIED; PHYSICAL POSTGRESQL PAYMENT-WRITE GATE REMAINS OPEN

## Completed in this stage

- `StoredPayment.version` is now part of the DB-neutral persistence contract.
- Payment replacement now requires an exact next version (`existing.version + 1`).
- Stale, equal, skipped, non-integer, or invalid versions are rejected.
- `updatedAt` remains strictly monotonic for Payment replacement.
- Deterministic Payments persistence tests were updated for version/CAS behavior.
- GitHub Actions Run #196 passed on the implementation head commit.
- The implementation was merged to `main`.
- Production remains untouched.

## Non-production PostgreSQL status

The disposable Neon rehearsal previously verified the canonical Payments schema, Action FK, indexes, constraints, and legacy-table preservation.

A real Payment-row SQL write remains blocked by the platform's financial-operation safety boundary. No bypass was attempted.

Therefore PostgreSQL-level verification of actual Payment insertion, physical idempotency conflict, physical CAS update, and real Payment rollback remains unclaimed.

## Chain

The canonical model remains:

Payment → Authorization → Action → Event → Evidence

Payments owns Payment truth. Action remains canonical BeatCore execution. Event and Evidence remain separate. No duplicate payment-action/event/evidence structure exists.

## Production gate

**🔴 CLOSED**

The production Payments migration must not execute until an approved non-production mechanism can perform the required Payment persistence verification and the results are reconciled.

## Next exact controlled stage

**🔵 APPROVED NON-PRODUCTION PAYMENT PERSISTENCE TEST MECHANISM**

Use an explicitly authorized test adapter/path capable of exercising PostgreSQL Payment writes without bypassing platform safety controls. Then verify:

1. valid Payment persistence;
2. actor/authorization integrity;
3. Payment → Action linkage;
4. idempotency and conflicting reuse;
5. version CAS;
6. status transitions including UNKNOWN/reconciliation;
7. provider/reference atomicity;
8. rollback;
9. Action/Event/Evidence separation.

Only after those pass should the Payments physical/runtime gate become 🟢 and the production migration readiness review begin.
