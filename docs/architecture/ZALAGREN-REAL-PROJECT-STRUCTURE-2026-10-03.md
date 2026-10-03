# ZALAGREN — REAL PROJECT STRUCTURE
Date: 2026-10-03

## Runtime

src/
- worker.ts — Cloudflare Worker routing and server orchestration
- home-ui.ts — participant-facing application shell
- zalagren-brand.ts — canonical visual identity

## Domain boundaries to keep explicit

src/domains/
- identity/
- participant/
- community/
- place/
- authorization/
- intent/
- proposal/
- action/
- event/
- evidence/
- genesis/
- payments/
- subscriptions/
- health/
- ride/
- food/
- market/
- accommodation/
- genzi/
- guardian/
- utilities/
- notifications/
- compliance/
- support/
- experience/
- integrations/
- edge/

The current worker is intentionally still a single deployable Worker. These boundaries are the target internal modules; extraction should be incremental and must not break the production contract.

## Database

migrations/
- one deterministic migration per bounded capability
- no destructive production mutation without rehearsal
- every production schema change gets a migration marker

Core physical chain:
identities → participants → contexts → relationships → capabilities → authorizations → intents → proposals → actions → events → evidences → genesis_knowledge → genesis_intelligence.

Service domains own their tables but must connect to the core chain through participant/context/authorization/event/evidence references.

## API contract families

/api/auth/*
/api/profile
/api/identity/*
/api/contact/*
/api/participation/*
/api/community/*
/api/services/*
/api/beatride/*
/api/beatfood/*
/api/marketplace/*
/api/health/*
/api/guardian/*
/api/payments/*
/api/plans
/api/subscription*
/api/policies/*

## Operational layers

1. Identity — who is participating?
2. Context — where/with whom/in what role?
3. Capability — what can this actor/service provide?
4. Authorization — what is allowed now?
5. Intent — what is wanted?
6. Proposal — what could happen?
7. Action — what was authorized to happen?
8. Event — what actually happened?
9. Evidence — what proves it?
10. Reconciliation — what must be settled?
11. Knowledge — what durable fact was learned?
12. Intelligence — what contextual proposal can be generated next?

## Status semantics

🟢 Verified = production evidence exists.
🟡 Supported = implementation exists but an external provider/legal/operational dependency remains.
🔵 Proposed = designed or submitted but not verified.
🔴 Failed = known broken and not hidden.

## Current architectural finding

The Neon production database already contains the core Zalagren operating spine and substantial service-specific structures. The main remaining work is not inventing more tables; it is completing the user-facing workflows, authorization enforcement, provider integrations, reconciliation, observability, security and production gates around those structures.


## Historical domains preserved in the project meaning

The structure also accounts for the accumulated product direction that is not yet a separate runtime module:

- Buildings & Units — represented through the canonical Place/resource model.
- Payments & Economy — payment intents, regulated rails, settlement and reconciliation.
- Education — knowledge and learning domain.
- Environment — sustainability, resource and future sensor/edge inputs.
- Accommodation/BnB — specialized commerce/reservation domain.
- OneApp — participant-facing ecosystem shell.
- Platform Website — public/discovery/organizational surface over the same core.
- CONSTANTYNA — human/cultural orchestration boundary.
- Physical/edge — local nodes, wearables, sensors, utility telemetry and resilient/offline execution.

These are not optional ideas; they are part of the accumulated Zalagren product meaning. Runtime implementation is staged by the ten-month execution sequence.
