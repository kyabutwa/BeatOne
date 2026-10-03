# Zalagren Protected Services Architecture — 2026-10-03

Zalagren is the coordination infrastructure; each Beat service is a participant-facing operating layer built on the canonical Identity → Participant → Community → Place → Relationship → Capability → Authorization → Intent → Proposal → Action → Event → Evidence chain.

## Service operating model

- BeatRide — first-party Zalagren mobility network. Zalagren owns dispatch and trip coordination; drivers, vehicles, licensing, insurance and lawful transport requirements remain explicit evidence/verification boundaries.
- BeatFood — first-party Zalagren commerce/fulfillment network.
- BeatMarket — first-party Zalagren commerce network.
- BeatGenzi — first-party Zalagren discovery/coordination network.
- BeatGuardian — Zalagren-coordinated safety layer: trusted check-ins and incident coordination, without pretending to replace emergency authorities.
- BeatHealth — protected health coordination: provider discovery and appointment/referral coordination are separated from general commerce; clinical authority and sensitive health obligations remain with authorized providers.
- BeatPay — regulated payment coordination: payment intents, idempotency and reconciliation belong to Zalagren; regulated money movement remains with authorized payment rails/providers. Zalagren does not silently become a bank or wallet.
- BeatUtilities — provider-dependent utility coordination: account references, service requests, place context and provider status are coordinated by Zalagren; the utility provider remains authoritative for the underlying service.

## Product pattern

Every service exposes the same participant primitives:
1. Discover.
2. Join as a participant/provider where permitted.
3. Establish context.
4. Declare capability.
5. Request/offer an intent.
6. Apply authorization.
7. Execute through the correct service boundary.
8. Record event and evidence.
9. Reconcile outcome.

The architecture deliberately isolates core service rails from optional experiments so a service feature can be disabled without disabling identity, authorization or the core participant experience.

## Research-informed guardrails

Modern marketplace architecture emphasizes reliability of the core path and isolation of optional functionality. Payment platforms commonly use idempotency, strong consistency and auditable ledgers. Kenya's ODPC publishes sector-specific guidance for health, finance, transport and other processing domains; payment-service authorization and cybersecurity remain regulated matters.

Zalagren therefore treats provider verification, legal authority, sensitive-data protection, payment authorization, and transport/clinical regulation as explicit boundaries rather than UI claims.
