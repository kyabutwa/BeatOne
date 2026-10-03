# ZALAGREN — 10-MONTH MASTER VISION & IMPLEMENTATION BASELINE
Date: 2026-10-03
Status model: 🟢 Verified / 🟡 Supported / 🔵 Proposed / 🔴 Failed

## 1. North star

Zalagren is Intelligent Living Infrastructure for Participating Communities.

Formula:
People + Places + Needs + Capabilities + Authority + Resources → Outcomes.

Zalagren is a coordination layer, not a property manager, bank, hospital, insurer, government identity authority, biometric database, marketplace-only product, ride-hailing clone, or chatbot.

Canonical chain:
Identity → Participant → Community → Place → Relationship → Capability → Authorization → Intent → Proposal → Action → Event → Evidence → Knowledge → Intelligence → Proposal.

GENESIS loop:
identity → participation → context → authority → intent → action → event → knowledge → intelligence → proposal → authorized decision.

## 2. What is already physically present

### Identity and participant
🟢 canonical identity/participant/account/session foundation
🟢 email authentication and verification routes
🟢 phone verification routes
🟢 legal identity persistence
🟢 persistent participant profile/avatar
🟢 account/session/device foundations
🟢 participant settings and privacy controls

### Core intelligence spine
🟢 identities, participants, contexts, relationships
🟢 capabilities and authorizations
🟢 intents, proposals, actions and executions
🟢 events and evidence
🟢 GENESIS knowledge/intelligence persistence
🟢 outcome trace and correlation/idempotency foundations

### Communities
🟢 public participant community participation
🟢 community onboarding/representation
🟢 community proposals and decision flows
🟢 provider bindings/invitations
🟢 work orders/maintenance
🟢 utilities
🟢 operational event stream
🟢 community subscriptions and management authorization

### Services
🟢 BeatRide first-party foundation
🟢 BeatFood first-party foundation
🟢 BeatMarket first-party marketplace foundation
🟢 BeatGenzi first-party service identity/catalog foundation
🟢 BeatGuardian coordination foundation
🟢 BeatHealth protected operating fabric
🟢 BeatPay payment/ledger foundations
🟢 BeatUtilities provider-dependent foundation

### Commercial and legal foundation
🟢 Free/Normal plan
🟢 Plus and Premium participant tiers
🟢 Community and Organization plans
🟢 subscription persistence
🟢 payment intent/idempotency foundations
🟢 M-PESA/Daraja server-side integration boundary
🟢 participant-facing policy surfaces
🟢 policy acceptance and privacy request persistence
🟡 live M-PESA collection — requires real Daraja production configuration and verification
🟡 ODPC/commercial/legal registration — implementation cannot substitute for external registration

## 3. Ten-month build sequence

### Month 1 — Foundation hardening
Identity, session, participant, profile, authorization, migration discipline, deployment verification, observability, security tests.

Exit gate:
Every participant can sign up, verify, sign in, persist profile, establish community context, and sign out without stale or browser-only state.

### Month 2 — Participant operating system
Settings, privacy, legal identity, consent, data requests, notifications, service discovery, participant timeline, universal intent/request flows.

Exit gate:
A participant can express a real need and see the authorized next action and resulting event.

### Month 3 — Community operating system
Community command center, provider onboarding, service bindings, places, maintenance, utilities, announcements, schedules, community decisions, evidence and accountability.

Exit gate:
A community can coordinate people, places, providers, resources and services without owning Zalagren services.

### Month 4 — BeatHealth protected network
Facility, department, worker, authorization, schedules, doctor availability, appointments, referrals, medicine availability, pharmacy orders, deliveries, insurance policy/authorization, audit and consent.

Exit gate:
Health workflows remain protected, role-based, auditable and provider-owned; Zalagren never invents clinical authority.

### Month 5 — First-party daily services
BeatRide dispatch, BeatFood fulfillment, BeatMarket, BeatGenzi and shared notification/event infrastructure.

Exit gate:
A participant can discover → request → authorize → execute → receive evidence for supported daily-life services.

### Month 6 — Payments and commerce
M-PESA production integration, payment reconciliation, receipts, refunds/cancellations, subscription lifecycle, provider settlement boundaries, consumer complaints and audit.

Exit gate:
No payment becomes successful from client claims; only reconciled provider evidence can activate money-dependent state.

### Month 7 — GENESIS intelligence
Context aggregation, evidence-backed knowledge, proposals, explainable recommendations, participant-controlled automation, escalation and human approval.

Exit gate:
GENESIS proposes; authorized humans/participants/providers decide. No hidden social scoring.

### Month 8 — Safety, trust and resilience
Device security, recovery, breach workflows, emergency paths, fraud/risk controls, rate limiting, audit exports, backup/restore, incident response, edge/fallback modes.

Exit gate:
Critical flows degrade safely rather than silently failing.

### Month 9 — Multi-community and multi-country readiness
Kenya operating model, DRC model, jurisdiction-aware policies, provider contracts, data-transfer controls, localization, currency/tax abstraction, community portability.

Exit gate:
Jurisdiction is an explicit context, not a hard-coded assumption.

### Month 10 — Production maturity
Reliability, load testing, disaster recovery, security assessment, accessibility, app-store/web packaging, operational dashboards, support operations, launch gates.

Exit gate:
Every public claim is backed by a verified capability, provider contract, licence, or documented supported/proposed state.

## 4. Service architecture

Every service follows:
Discover → Join/Offer → Context → Capability → Intent → Authorization → Proposal → Action → Event → Evidence → Reconciliation.

First-party:
- BeatRide
- BeatFood
- BeatMarket
- BeatGenzi

Protected/coordinated:
- BeatHealth
- BeatGuardian
- BeatPay
- BeatUtilities

## 5. Participant plans

Normal: KES 0.
Plus: KES 499/month.
Premium: KES 999/month.

Paid plans add product capabilities. They do not purchase legal authority, clinical authority, community governance authority, or access to another person's protected data.

Community: KES 4,999/month.
Organization: KES 9,999/month.

Prices are product configuration, not a statement of market or legal requirements.

## 6. Non-negotiable product rules

1. Authentication is never authorization.
2. Provider verification is never implied by listing.
3. Health data is never exposed merely because a participant is authenticated.
4. Payment success is never accepted from a browser.
5. M-PESA credentials never live in source code.
6. Community authority never becomes platform ownership.
7. Biometrics are optional and purpose-bound.
8. Minimum data and purpose limitation apply by default.
9. Every consequential action has actor, context, authorization and evidence.
10. GENESIS never becomes an autonomous authority.
11. Unsupported integrations remain visible as supported/proposed, not fake.
12. Legal and regulatory status is explicit.

## 7. Production gates

Before commercial launch:
- legal entity and contracts
- ODPC controller/processor assessment and required registration
- DPIA where required
- DPO/compliance ownership where required
- health-specific compliance/certification where applicable
- transport/operator licensing where applicable
- payment-provider commercial onboarding
- tax/accounting review
- consumer/refund/complaint workflows
- security assessment
- backup/restore rehearsal
- incident/breach response rehearsal
- provider verification and contracts
- production M-PESA callback verification
- public terms/privacy/consumer/payment policies

Kenya data protection registration and obligations depend on the actual processing activities; ODPC specifically identifies health, transport/online passenger hailing, financial services and other categories as non-exempt areas, so Zalagren must not treat a small-company exemption as a blanket launch exemption. citeturn0search0turn0search1

## 8. Definition of done

Zalagren is not "done" because the dashboard renders.

A capability is done only when:
- persistence exists;
- authorization exists;
- API exists;
- participant/provider interface exists;
- event/evidence trail exists;
- failure state exists;
- idempotency exists where consequential;
- security boundaries are tested;
- legal/provider boundary is explicit;
- production verification passes.

