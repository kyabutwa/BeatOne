# Zalagren Ecosystem Master Architecture — 2026-10-02

## Authority

This document is the current product-level reconciliation of the accumulated Zalagren work: NEOOLITEC, Savannah Genesis, EarthBeat, GENESIS, CONSTANTYNA, Zalagren, community nodes, services and the current Cloudflare + Neon implementation.

The historical names remain architectural lineage/reference terms. **Zalagren is the current product identity.** No historical product name may appear as a user-facing brand.

## Product

Zalagren is Intelligent Living Infrastructure for Participating Communities.

It is a coordination and participation infrastructure connecting:

- identity and participant accounts;
- communities and governance;
- places and physical-world context;
- access and invitations;
- capabilities and authorization;
- commerce and services;
- payments through regulated external rails;
- mobility;
- food;
- accommodation/BnB;
- health coordination;
- utilities and resources;
- discovery;
- trust/guardian functions;
- GENESIS intelligence;
- evidence and operational history.

The ecosystem is not a replacement for regulated banks, payment systems, transport operators, hotels, hospitals, governments, identity authorities or community governance.

## Historical lineage

NEOOLITEC is the originating company/operator and governance/partnership layer.

Savannah Genesis supplied the early residential digital-infrastructure/RDPI methodology, local-first and operational-resilience thinking.

EarthBeat supplied the physical/edge, digital-twin, utility, access, wearable and economic-system direction.

GENESIS is the provider-neutral intelligence engine.

CONSTANTYNA is the human/cultural orchestration layer.

Zalagren is the current unified product/ecosystem that carries the durable semantics into real community nodes and services.

## Canonical semantic chain

Jurisdiction → Identity → Participant → Legal/Regulatory Status → Community → Place → Relationship → Capability → Authorization → Intent → Proposal → Action → Event → Evidence → Knowledge → GENESIS proposal.

The invariant is:

**No Authorization → No Consequential Action.**

Authentication never creates authority.

Participation never creates unrestricted authority.

GENESIS never creates authority.

## Core domains

### Foundation
Identity, Participant, Account, Credential, Session, Contact and legal identity.

### Participation
Communities, membership, roles, representatives, places, relationships, contexts and invitations.

### Governance
Capabilities, authorizations, proposals, decisions, policy, evidence and audit.

### Access
Visitor, resident, worker, owner, tenant, guest and temporary access workflows.

### Economy
Marketplace, offers, services, subscriptions, orders, invoices, payment intents, provider execution and reconciliation.

### Services
BeatPay, BeatRide, BeatFood, accommodation/BnB, Genzi, Guardian, utilities and future service domains.

### Health
BeatHealth is isolated from generic marketplace permissions and follows its own sensitive-data, clinical-role and regulated-provider boundaries.

### Intelligence
GENESIS observes permitted context, reasons within policy, produces explanations/proposals and learns from evidence. It does not silently approve or execute.

### Physical/edge
The former EarthBeat direction is retained as a future physical/edge capability family: local nodes, sensors, utility telemetry, access hardware, wearables, local intelligence and resilient/offline operation. It is not a visible product brand.

## Domain contract

Every domain must define:

1. participant;
2. context;
3. resource;
4. capability;
5. authorization;
6. intent;
7. proposal;
8. action;
9. execution/provider boundary;
10. event;
11. evidence;
12. compliance state;
13. dispute/complaint path;
14. retention/data policy.

A domain is not production-ready merely because a table or UI exists.

## Marketplace maturity model

Marketplace is an ecosystem commerce layer, not a simple listing table.

A listing must be represented as:

Provider → Offer → Category → Scope → Price → Availability → Fulfillment → Jurisdiction → Verification → Compliance → Tax → Terms → Complaint path → Publication → Order/Reservation → Provider execution → Payment → Reconciliation → Evidence.

Publication state is separate from verification, compliance and tax state.

No seller, permit, eTIMS status, tourism licence or regulated provider status may be inferred.

### Marketplace categories

- goods;
- services;
- assets;
- projects;
- opportunities;
- capabilities;
- accommodation/BnB.

### Accommodation/BnB

Accommodation is a structured marketplace domain, not a title field.

It requires:

- accommodation type;
- stay type;
- guest capacity;
- bedrooms/bathrooms where applicable;
- check-in/check-out;
- amenities;
- house rules;
- location visibility;
- host/provider identity;
- property/place relationship;
- regulatory/licensing evidence where applicable;
- tax state;
- availability;
- reservation request;
- acceptance/rejection;
- cancellation;
- provider reference;
- payment/reconciliation evidence.

For Kenya, Tourism Regulatory Authority requirements must be represented as evidence/status rather than assumed compliance. Short-term rentals and serviced apartments fall within TRA's Class A licensing framework; the platform must not publish a listing as licensed without real evidence.

## Kenya-first jurisdiction

Kenya is the launch jurisdiction.

The platform therefore requires jurisdiction-aware policy for:

- Data Protection Act and ODPC rules;
- cybersecurity and electronic transactions;
- payment-system/provider boundaries;
- AML/CFT where regulated financial activity is involved;
- consumer protection;
- tax/eTIMS;
- tourism accommodation;
- food safety;
- transport/provider compliance;
- health/digital-health;
- children's data;
- cross-border data transfers.

DRC is a separate jurisdiction layer. Kenya rules must never be copied into DRC as if they were universal law.

## Truth model

Every regulatory, provider and operational state uses:

- VERIFIED — current evidence checked;
- SUPPORTED — architecture supports it, external proof still required;
- PROPOSED — design exists, not proven;
- FAILED — required control/evidence is missing.

The UI must never promote SUPPORTED or PROPOSED to VERIFIED through wording.

## Data governance

Sensitive or regulated data must be purpose-bound and minimised.

The system must preserve:

- purpose;
- lawful basis where applicable;
- consent where consent is the basis;
- access scope;
- recipient/provider;
- retention;
- deletion/rights workflow;
- cross-border transfer basis/safeguard;
- audit evidence.

Raw biometric storage is not a default requirement.

## Provider boundary

External systems remain authoritative for their regulated execution.

Examples:

- payment provider executes payment;
- transport provider dispatches transport;
- tourism operator supplies licensed accommodation;
- food provider operates the food business;
- clinical provider performs regulated healthcare;
- government/authorized identity source performs official verification.

Zalagren records the relationship, authorization, provider reference, outcome and evidence.

## Launch gates

A production launch is not declared complete until:

- foundation runtime passes;
- database migration ledger is reconciled;
- Kenya compliance controls are implemented;
- sensitive-data controls are proven;
- provider boundaries are explicit;
- Marketplace/BnB workflows are structurally complete;
- community authority is proven;
- at least one complete vertical slice reaches Action → Event → Evidence;
- CI passes;
- deployment smoke test passes;
- no stale user-facing historical branding remains;
- the canonical Zalagren logo asset is used;
- no fake operational data exists.

## Non-negotiable rule

Build the ecosystem as one governed system, but never collapse distinct legal, technical or human authorities into one artificial Zalagren authority.
