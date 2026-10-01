# Event → Evidence Producer Coverage Reconciliation

**Status:** 🟡 SUPPORTED — CURRENT PRODUCER COVERAGE RECONCILED; PHYSICAL MIGRATION STILL CLOSED
**Date:** 2026-10-02

## Covered producers

### 1. Authorized Action operation — 🟢 VERIFIED
`src/beatcore-operations.ts` creates an Event from the canonical Action inside the repository transaction.
It preserves Action actor/context, uses the Action state, records causation as the Action id, and does not claim completion.

### 2. Payments — 🟢 VERIFIED BOUNDARY
`src/beatcore-payments.ts` explicitly does not create payment Events/Evidence or perform external processing.
Therefore Payments remains a producer-consumer domain boundary: consequential payment execution may later produce canonical Events/Evidence through the canonical operation/integration path, but this Payments constructor does not bypass that boundary.

### 3. Generic Event creation — 🟢 VERIFIED
`createEvent()` enforces type/source/timestamp/version and Action state, actor, and context consistency when Action linkage exists. Standalone Events remain explicitly permitted by the Event contract.

### 4. Generic Evidence creation — 🟢 VERIFIED
`createEvidence()` enforces source, timestamp, verification state, and provider/reference atomicity. It defaults verification to UNVERIFIED.

## Required producer coverage before migration

The following still require explicit physical/runtime coverage before production migration:
- Action → Event PostgreSQL persistence;
- standalone Event PostgreSQL persistence;
- Event → Evidence PostgreSQL persistence;
- invalid Event/Evidence FK rejection;
- Event state/Action state mismatch rejection at the physical/application boundary;
- actor/context integrity;
- verification transitions;
- provider/reference atomicity;
- rollback;
- version/concurrency semantics for Event;
- evidence linkage semantics;
- disposition of legacy `event_evidence`;
- all higher-domain producers that create Events/Evidence.

## GENESIS

GENESIS remains observation/proposal only. It may consume canonical Event/Evidence records, but it cannot authorize, fabricate, or silently verify them.

## Gate

**🟡 SUPPORTED — producer application boundaries are reconciled, but PostgreSQL runtime coverage and legacy bridge disposition remain open.**

No production Event/Evidence migration is authorized by this document.
