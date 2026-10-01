# BeatOne — Payments Boundary Fresh Reconciliation v1.0

**Status:** FRESH RECONCILIATION COMPLETE — PAYMENTS CONTRACT READY TO DEFINE
**Layer:** Stage 14 — Payments
**Date:** 2026-10-01

## 1. Purpose

This reconciliation establishes the provider-neutral Payments boundary after the completed BeatCore → GENESIS → Higher Domains foundation.

It does not integrate M-PESA, banks, cards, wallets, payment gateways, or any external provider. It identifies exactly what Payments owns and what it must delegate to BeatCore, external integrations, and consuming domains.

## 2. Authority Order

Product Architecture → Technical Architecture → BeatCore → Payments Contract → Payments Implementation → Persistence → API/Application → Experience → Integration → Infrastructure.

Payments cannot redefine foundational Identity, Participant, Context, Capability, Authorization, Action, Event, Evidence, or GENESIS semantics.

## 3. Repository Findings

### 🟢 CANONICAL / VERIFIED FOUNDATION

The current architecture establishes:

- canonical Identity and Participant ownership;
- canonical Context, Capability, and Authorization;
- canonical Intent and Proposal;
- canonical Action, Event, and Evidence separation;
- actor, correlation, causation, lifecycle, and idempotency primitives;
- explicit unknown/failure/reconciliation states;
- domain-owned persistence;
- provider-neutral Integration Contract;
- external identifier separation;
- GENESIS proposal/authority boundary.

### 🟡 SUPPORTED

Product and Technical Architecture identify Payments as a higher domain and explicitly describe the cross-domain sequence:

Commerce → Payment Intent → Payments → Payment Action → Payment Event → Evidence → Commerce Fulfillment.

The architecture also identifies payment networks, banks, mobile money, and other external systems as integrations rather than canonical BeatOne business truth.

### 🔵 NOT YET CANONICAL

No dedicated Payments business contract exists yet.

No Payments-specific persistence schema is being treated as canonical.

No payment provider is selected.

No provider adapter is being implemented.

No production migration is required for this reconciliation.

## 4. Payments Domain Ownership

Payments owns the business semantics of a payment operation, including:

- payment intent/request;
- payer and payee references;
- amount and currency;
- payment purpose/reference;
- payment lifecycle;
- payment-specific validation;
- payment-specific capabilities;
- payment-specific authorization requirements;
- idempotency requirements;
- payment correlation/causation;
- external reference mapping;
- payment outcome and reconciliation state;
- payment-specific refund/reversal semantics when explicitly supported.

Payments does NOT own:

- canonical identity;
- participant records;
- general authorization infrastructure;
- generic Action/Event/Evidence semantics;
- external provider truth;
- Commerce fulfillment;
- Economy accounting semantics unless separately contracted;
- GENESIS authority.

## 5. Canonical Payment Lifecycle

The domain must preserve the distinction:

Payment Intent → Authorization → Action → External Processing → Event → Evidence → Reconciliation.

The exact lifecycle may include:

REQUESTED
AUTHORIZED
PROCESSING
PENDING
COMPLETED
FAILED
CANCELLED
PARTIAL
UNKNOWN
REVERSED
RECONCILIATION_REQUIRED
RECONCILED

A provider request being accepted is not equivalent to a completed payment.

A provider timeout or ambiguous response must remain UNKNOWN/PENDING or enter reconciliation rather than being converted to success.

## 6. Actor and Authority Boundary

A consequential payment must be attributable to a canonical actor and participant where applicable.

Payment authorization must use the canonical BeatCore Authorization boundary.

Payments may require domain-specific capability and scope, but the resulting authorization remains canonical BeatCore Authorization.

No payment operation may create a parallel payment-specific authorization system.

## 7. Money Representation Boundary

The Payments contract must represent monetary values explicitly as domain data.

At minimum:

- amount;
- currency;
- precision/scale rules appropriate to the currency;
- payer;
- payee where applicable;
- payment purpose/reference.

Floating-point representation must not be used where it can create monetary ambiguity.

No wallet balance, bank balance, or provider account balance becomes canonical BeatOne money merely because an external provider reports it.

## 8. External Provider Boundary

The architecture requires:

Payments Domain → Integration Contract → Adapter → External Provider.

External provider identifiers are secondary references.

Provider responses are external evidence/input to reconciliation; they do not redefine Payments semantics.

This contract therefore remains provider-neutral.

## 9. Idempotency Boundary

Every consequential payment initiation must have a stable idempotency key scoped according to the Payments contract.

Retries with the same valid idempotency identity must not create duplicate consequential payment outcomes.

Webhook/provider callbacks must also be idempotently processed.

## 10. Unknown and Reconciliation Boundary

Payments must explicitly support uncertainty.

Examples:

- request timed out after external submission;
- provider response unavailable;
- webhook received without resolvable payment;
- conflicting provider outcomes;
- local state differs from provider evidence.

These states require reconciliation rather than fabricated completion.

## 11. Cross-Domain Ownership

Payments owns payment truth.

A consuming domain owns its own fulfillment/business truth.

Example:

Commerce
→ creates/requests payment intent
→ Payments owns payment execution/lifecycle
→ Payments emits canonical payment event/evidence
→ Commerce decides its own fulfillment transition according to its contract.

Payments must not mark Commerce fulfillment complete.

## 12. Refund and Reversal Boundary

Refunds/reversals are payment-domain concepts only when explicitly defined by the Payments contract.

They must reference the original payment and preserve their own authorization, action, event, evidence, idempotency, and reconciliation semantics.

No provider-specific reversal behavior is allowed to become canonical without a domain contract.

## 13. Persistence Boundary

Payments owns its payment-domain records.

Persistence must preserve:

- canonical BeatOne references;
- monetary values;
- lifecycle;
- authorization basis;
- idempotency;
- correlation/causation;
- external references;
- timestamps;
- reconciliation state;
- uniqueness and integrity.

Consumers reference payment records through canonical operations/contracts rather than direct writes.

No production migration is part of this step.

## 14. API / Application Boundary

The API/application layer may expose payment operations only through the canonical Payments contract.

Handlers must not:

- implement hidden payment semantics;
- bypass authorization;
- directly write provider outcomes as canonical completion;
- create duplicate payment truth;
- use provider IDs as canonical payment identity;
- collapse UNKNOWN into SUCCESS.

## 15. GENESIS Boundary

GENESIS may observe permitted payment information and propose actions or insights.

GENESIS cannot:

- authorize payments;
- execute payments without pre-existing explicit automation authorization;
- manufacture payment completion;
- fabricate payment evidence;
- bypass payment authorization.

## 16. Security and Privacy

Payments is consequential and potentially sensitive.

The implementation must apply:

- minimum necessary data;
- authorization-aware access;
- secret isolation;
- provider credential isolation;
- auditability;
- no secrets in source/client/logs;
- no unnecessary payment instrument data storage.

The Payments domain does not become a generic credential vault.

## 17. Non-Goals

This reconciliation does not implement:

- M-PESA;
- banks;
- card networks;
- wallets;
- payment gateways;
- provider SDKs;
- provider credentials;
- production migrations;
- production database changes;
- UI;
- OneApp;
- Website;
- Economy;
- Commerce;
- GENESIS expansion;
- hardware.

## 18. Required Payments Contract

The canonical Payments contract must define:

1. Payment entity ownership and identifiers.
2. Payment request/intent semantics.
3. Payer/payee references.
4. Monetary representation.
5. Purpose/reference semantics.
6. Authorization requirements.
7. Payment lifecycle and valid transitions.
8. Action/Event/Evidence relationship.
9. Idempotency.
10. Correlation and causation.
11. External provider reference separation.
12. Unknown/failure/reconciliation behavior.
13. Refund/reversal semantics if supported.
14. Cross-domain ownership.
15. Persistence ownership.
16. API/application boundary.
17. Integration boundary.
18. GENESIS boundary.
19. Privacy/security constraints.
20. Contract invariants and required tests.

## 19. Completion Gate

**🟢 VERIFIED — PAYMENTS BOUNDARY RECONCILED.**

The repository contains sufficient foundational contracts to define the canonical provider-neutral Payments contract without modifying foundational semantics.

**Next exact action: establish `docs/contracts/BEATCORE-PAYMENTS.md`.**