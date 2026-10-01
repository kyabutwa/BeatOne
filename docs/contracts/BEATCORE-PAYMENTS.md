# BeatOne — Payments Contract v1.0

**Status:** CANONICAL CONTRACT ESTABLISHED — PROVIDER NEUTRAL
**Layer:** Higher Domain — Payments
**Date:** 2026-10-01
**Authority:** Product Architecture → Technical Architecture → BeatCore → this Payments Contract

## 1. Purpose

Payments owns the canonical business semantics of consequential payment operations in BeatOne.

Payments consumes BeatCore. It does not redefine Identity, Participant, Context, Capability, Authorization, Intent, Proposal, Action, Event, Evidence, or GENESIS.

Payments is not a bank, wallet, card network, mobile-money provider, payment gateway, custodian, or regulated financial institution.

## 2. Domain Boundary

Payments owns:

- payment intent/request;
- payer and payee references;
- monetary amount and currency;
- payment purpose/reference;
- payment lifecycle;
- payment-specific validation;
- payment-specific capability requirements;
- payment-specific authorization requirements;
- idempotency;
- correlation and causation;
- external provider references;
- payment outcomes;
- payment reconciliation state;
- refunds/reversals when supported by this contract and applicable law/provider capability.

Payments does not own:

- canonical Identity or Participant;
- generic authorization infrastructure;
- generic Action/Event/Evidence semantics;
- external provider business truth;
- Commerce fulfillment;
- general Economy/accounting semantics;
- GENESIS authority.

## 3. Canonical Payment Entity

A Payment represents a BeatOne payment-domain operation connecting canonical participants or other authorized parties for a specified monetary purpose.

Required semantic data:

- payment_id: stable BeatOne-owned identifier;
- payer_participant_id: canonical participant reference where applicable;
- payee_participant_id: canonical participant reference where applicable;
- amount: exact monetary value;
- currency: explicit currency code;
- purpose/reference: domain-defined reason or reference;
- status/lifecycle state;
- actor/authorization basis;
- idempotency key;
- correlation identifiers;
- timestamps;
- external references where an integration exists.

Provider identifiers are never canonical BeatOne payment identity.

## 4. Monetary Representation

Amount must use an exact representation appropriate to monetary arithmetic. Floating-point values must not be used where they can introduce monetary ambiguity.

Currency is explicit and immutable for a payment once the payment becomes consequential.

Currency-specific precision and validation rules belong to the Payments implementation under this contract.

Provider-reported balances are external information and do not automatically establish canonical BeatOne balances.

## 5. Authorization Boundary

Payment execution requires the canonical BeatCore Authorization boundary.

Payment-specific capabilities may constrain which payment operation is possible, but capability is not authorization.

A payment Action must carry an attributable authorization basis.

The foundational invariant applies:

`Action.actorId === Authorization.actorId`

No Payments implementation may create a parallel payment authorization model.

## 6. Lifecycle

The canonical semantic lifecycle is:

REQUESTED → AUTHORIZED → PROCESSING → COMPLETED

Applicable alternative states include:

- PENDING;
- FAILED;
- DENIED;
- REJECTED;
- CANCELLED;
- PARTIAL;
- UNKNOWN;
- REVERSED;
- RECONCILIATION_REQUIRED;
- RECONCILED.

Not every Payment must use every state.

An implementation must reject invalid transitions according to the concrete payment operation.

Request acceptance is not payment completion.

External submission is not payment completion.

Absence of an error is not proof of completion.

## 7. Action / Event / Evidence

Payments preserves the canonical separation:

Payment Intent → Authorization → Action → External Processing → Event → Evidence.

Action represents the accepted consequential operation.

Event represents an actual recognized payment occurrence or state transition.

Evidence substantiates an event or relevant external state.

A request, proposal, provider acknowledgement, prediction, or webhook receipt must not be represented as a completed payment event unless the applicable payment contract and evidence establish that meaning.

## 8. Idempotency

Consequential payment initiation is idempotent.

Every initiation requires an idempotency identity suitable for the operation scope.

Repeating a request with the same valid idempotency identity must not create duplicate consequential payment outcomes.

Webhook and callback processing must also be idempotent.

Conflicting reuse of an idempotency identity with materially different payment parameters must be rejected.

## 9. Correlation and Causation

Where applicable, Payments preserves distinct:

- request_id;
- correlation_id;
- causation_id;
- action_id;
- event_id;
- evidence_id;
- external_reference.

These identifiers are not interchangeable.

## 10. External Provider Boundary

The canonical integration sequence is:

Payments Domain → Integration Contract → Adapter → External Provider.

The Payments domain remains provider-neutral.

External provider IDs are secondary references.

Provider responses must be interpreted through the integration/reconciliation boundary and must not redefine Payments semantics.

No M-PESA, bank, card, wallet, gateway, or provider SDK is selected by this contract.

## 11. Unknown and Reconciliation

External UNKNOWN_RESULT is a first-class state.

Examples include timeout after submission, unavailable provider response, contradictory provider results, unresolved webhook references, or local/provider state divergence.

UNKNOWN must not be silently converted to COMPLETED.

The reconciliation process may later establish a confirmed event and transition the Payment to an appropriate terminal state.

## 12. Refunds and Reversals

Where supported, a refund or reversal is a new consequential payment-domain operation referencing the original Payment.

It requires its own:

- authorization;
- Action;
- lifecycle;
- idempotency;
- Event;
- Evidence;
- reconciliation state.

Provider-specific reversal behavior does not become canonical business meaning without explicit domain mapping.

## 13. Cross-Domain Ownership

Payments owns payment truth.

A consuming domain owns its own business outcome.

Canonical example:

Commerce → Payment Intent → Payments → Payment Action → Payment Event → Evidence → Commerce Fulfillment.

Payments cannot declare Commerce fulfillment complete.

Commerce cannot directly mutate Payment state.

Cross-domain interaction uses explicit contracts and canonical domain operations.

## 14. Persistence Ownership

Payments owns persistence of Payment-domain state.

Persistence must preserve:

- BeatOne-owned identifiers;
- canonical participant references;
- exact monetary values;
- lifecycle;
- authorization basis;
- idempotency uniqueness;
- correlation/causation;
- external references;
- timestamps;
- reconciliation state;
- referential and integrity constraints.

Direct cross-domain database writes are prohibited unless explicitly authorized by the owning contract.

No production migration is implied by establishing this contract.

## 15. API/Application Boundary

API/application code exposes Payments operations without redefining payment semantics.

Handlers must not:

- bypass authorization;
- directly fabricate payment events;
- treat provider acknowledgement as canonical completion;
- create competing payment truth;
- use provider IDs as canonical identifiers;
- collapse UNKNOWN into SUCCESS;
- compensate for missing domain invariants in an unrelated layer.

## 16. GENESIS Boundary

GENESIS may consume permitted payment context and produce observation, insight, knowledge, recommendation, risk, prediction, or proposal.

GENESIS does not inherently authorize or execute a payment.

Payment execution through automation is permitted only where explicit pre-existing automation authorization establishes scope, conditions, expiry, auditability, and enforcement.

GENESIS cannot fabricate payment Events or Evidence.

## 17. Security and Privacy

Payments must apply minimum necessary data, authorization-aware access, auditability, secure secret handling, and appropriate retention.

Payment credentials, provider secrets, and sensitive authentication material must not be committed to source, exposed in client bundles, or written to logs.

Payments is not a generic credential vault.

## 18. Invariants

1. Every consequential Payment is attributable.
2. Payment execution requires applicable canonical Authorization.
3. Payment authorization cannot be replaced by Capability alone.
4. Payment provider IDs are never canonical BeatOne identity.
5. Amount and currency are explicit and exact.
6. Consequential payment initiation is idempotent.
7. Duplicate retries cannot create duplicate consequential outcomes.
8. Action is not automatically Event.
9. Event is not automatically Evidence.
10. Provider acknowledgement is not automatically payment completion.
11. UNKNOWN remains UNKNOWN until reconciliation establishes an outcome.
12. Failed operations cannot silently become successful Events.
13. Payments cannot own another domain's fulfillment truth.
14. Consuming domains cannot directly mutate canonical Payment truth.
15. GENESIS cannot manufacture payment authority.
16. External providers do not redefine Payments semantics.
17. Refunds/reversals preserve authorization, lifecycle, idempotency, event, evidence, and reconciliation boundaries.
18. Production migrations cannot outrun the proven Payments contract.

## 19. Required Verification

Before Payments implementation is considered complete, verification must prove:

- unauthorized payment execution is rejected;
- expired authorization is rejected;
- actor/authorization mismatch is rejected;
- invalid monetary values are rejected;
- invalid currency is rejected;
- invalid lifecycle transitions are rejected;
- duplicate idempotency requests do not duplicate consequential outcomes;
- conflicting idempotency reuse is rejected;
- Action is not fabricated as Event;
- Event is not fabricated as Evidence;
- provider timeout remains UNKNOWN/PENDING or reconciliation-required;
- provider failure is not converted into success;
- external provider identifiers remain secondary;
- cross-domain direct writes are blocked;
- refund/reversal operations preserve original-payment linkage;
- GENESIS cannot bypass authorization.

## 20. Implementation Sequence

Fresh Payments Reconciliation → Payments Contract → Payments Implementation → Payments Persistence Reconciliation → Payments Tests/Invariants → CI Verification → Fresh Payments Final Reconciliation.

Provider integration remains a later controlled stage.

## 21. Contract Gate

**🟢 VERIFIED — CANONICAL PROVIDER-NEUTRAL PAYMENTS CONTRACT ESTABLISHED.**

This contract is now the authority for Payments implementation. Implementation must not silently expand the domain boundary.