# BeatOne — Technical Architecture Baseline v1.0

**Status:** FROZEN AFTER APPROVAL  
**Scope:** OneApp Ecosystem  
**Date:** 2026-10-01

## 1. Purpose
This document translates the frozen BeatOne Product Architecture Baseline into an implementable technical architecture. It defines boundaries, domain responsibilities, dependency direction, data ownership, persistence, API, authentication/authorization, application surfaces, lifecycle integrity, events, evidence, GENESIS, integrations, infrastructure, testing, deployment, failure/recovery, migration, reconciliation, and architecture change control. It is subordinate to Product Architecture and defines how, not what.

## 2. Architectural Authority
Product Architecture → Technical Architecture → Domain Contracts → Data/Persistence → API/Application → Experience → Integration → Infrastructure → Implementation. Lower layers cannot silently redefine higher-layer meaning.

## 3. Primary Technical Objective
One coherent ecosystem; one canonical semantic core; explicit domain ownership; one identity/participation model; explicit authorization; durable lifecycle semantics; multiple access surfaces sharing business truth; controlled integrations; intelligence without authority. Prevent duplicate truth, competing identity/auth, UI-owned business logic, DB-specific semantics, AI authority leakage, cross-domain coupling, fabricated events/evidence, provider semantics leaking into the core, migration drift, and patch-driven architecture.

## 4. Canonical System Model
EXPERIENCE (OneApp + Platform Website) → APPLICATION/API → DOMAIN CORE → DOMAIN SERVICES → PERSISTENCE → INFRASTRUCTURE.

## 5. Canonical Core
BeatCore owns People, Communities, Identity, Participant, Access, Place, Building, Floor, Unit, Resource, Relationship, Context, Capability, Authorization, Intent, Proposal, Action, Event, and Evidence. Each canonical concept has one semantic owner.

## 6. Core Dependency Direction
BeatCore → People + Communities → Identity → Participant → Access → Place/Building/Floor/Unit/Resource → Relationship → Context → Capability → Authorization → Intent → Proposal → Action → Event → Evidence.

## 7. Domain Ownership
One technical owner per canonical concept. Other domains consume, compose, query, or extend through approved contracts but do not silently redefine authoritative meaning. Projections may exist but never become competing business truth.

## 8. Canonical Identity Model
Identity = who/what participates; Participant = identity participating in context; Account = account construct; Credential = authentication mechanism; Session = authenticated interaction; Authorization = permission for consequential operation. Account ≠ Identity; Credential ≠ Identity; Session ≠ Authorization; Authentication ≠ Authorization.

## 9. Authentication Architecture
Support replaceable mechanisms such as passwords, passkeys, device auth, OTP, recovery, optional biometrics, and optional hardware credentials. Authentication establishes an authenticated actor/session; it does not establish business authority.

## 10. Authorization Architecture
Authorization is first-class and evaluates as applicable actor, identity, participant, context, relationship, capability, policy, time, scope, delegation, community rules, and explicit approval. Consequential decisions are attributable, bounded, auditable, and revocable where applicable.

## 11. Policy Decision vs Enforcement
Decision and enforcement are separate responsibilities. Canonical authority semantics apply across API, application, OneApp, Website, devices, physical controls, and integrations. Frontend checks are never the sole security boundary.

## 12. Participant Context
Identity → Participant → Community → Place → Relationship → Capability → Authorization. Roles and authority are contextual.

## 13. Command / Query Separation
Commands mutate canonical state; queries retrieve authorized information without mutation. Consequential commands require authentication where applicable, authorization, domain validation, persistence, lifecycle handling, events where applicable, and auditability.

## 14. Domain Operations
Business operations use meaningful domain operations rather than arbitrary database manipulation. Examples: RequestVisitorAccess, ApproveServiceRequest, CreateReservation, AuthorizePayment, IssueCredential, RevokeAuthorization, CompleteDelivery.

## 15. Transaction Boundary
A consequential operation controls validation, authorization, domain transition, persistence, event recording, and audit metadata as applicable. External operations are not assumed atomically transactional with local persistence. Pending, unknown, partial, failed, and reconciliation-required states are explicit.

## 16. Action → Event
Authorized Command → Action → Domain State Change → Event. Request acceptance is not proof that an action occurred; action is not automatically a confirmed event.

## 17. Event Architecture
Events represent recognized occurrences and support event ID/type, occurrence time, actor/context, source, related entity, correlation/causation IDs, semantic version, and integrity metadata. Events are domain-owned, not a generic message dump.

## 18. Evidence Architecture
Event → Evidence → Source → Verification/Reconciliation. Evidence may come from BeatOne records, devices, providers, documents, sensors, human confirmation, or signed records. Source attribution and verification remain explicit.

## 19. Action/Event/Evidence Integrity
Request ≠ Action; Action ≠ Event; Event ≠ Evidence; Evidence ≠ Authorization. Example payment lifecycle: request → authorization → action → provider processing → confirmed event → provider/transaction evidence.

## 20. Correlation and Causation
Consequential operations should support request_id, correlation_id, causation_id, action_id, event_id, evidence_id, and external_reference.

## 21. Idempotency
Consequential operations must be retry-safe where duplicate execution could cause harm, especially payments, access, reservations, service requests, external APIs, and webhooks.

## 22. State Machines
Generic lifecycle: REQUESTED → AUTHORIZED → PROCESSING → COMPLETED. Other states include DENIED, REJECTED, FAILED, EXPIRED, CANCELLED, PARTIAL, DISPUTED, REVERSED, RECONCILED. Invalid transitions are rejected. Absence of failure is not success.

## 23. Persistence Architecture
Persistence is canonical durable domain state. Preserve transactional integrity, constraints, uniqueness, appropriate FKs, lifecycle state, timestamps, audit metadata, migrations, and reconciliation. Database implements domain contracts; schema does not redefine product meaning.

## 24. Data Ownership
Identity owns identity; Participant owns participation; Authorization owns authorization; Action owns action; Event owns event; Evidence owns evidence. Other domains reference canonical records rather than silently creating authoritative duplicates.

## 25. Read Models
Read models may optimize OneApp, Website, dashboards, administration, GENESIS, and analytics. They may denormalize but never become competing business truth.

## 26. API Architecture
API exposes authorized access to identity, participant context, capabilities, commands, queries, lifecycle state, events/evidence where permitted. API is a boundary, not a second domain model.

## 27. API Authorization
Protected operations must answer, as applicable, who, identity, participant context, where, when, purpose, capability, and authority. Enforcement is server-side/authoritative.

## 28. API Versioning
Distinguish internal domain, application/API, and external integration contracts. Preserve semantics; breaking changes require explicit contract review and migration planning.

## 29. OneApp Architecture
OneApp is the primary participant-facing experience: Experience → Application State → API Client → Canonical Backend. It does not own identity, participant, authorization, action, event, or evidence truth.

## 30. Platform Website Architecture
The Website is an alternate access experience to the same ecosystem and backend contracts. It does not create parallel identity, authorization, lifecycle, or domain truth.

## 31. UI State vs Domain State
UI distinguishes LOADING, AVAILABLE, STALE, PENDING, CONFIRMED, FAILED, UNAUTHORIZED, and UNAVAILABLE. It must not display success when the backend only accepted a request, returned pending, or lacks confirmation.

## 32. GENESIS Architecture
Canonical Data → Permitted Context → GENESIS → Knowledge/Intelligence → Proposal → Authorization Boundary → Action. GENESIS is isolated behind intelligence contracts and must not arbitrarily mutate canonical state.

## 33. GENESIS Input Boundary
GENESIS uses only authorized information, including permitted participant/community/context/domain state, events, evidence, environment information, and permitted external information.

## 34. GENESIS Output Types
OBSERVATION, INSIGHT, KNOWLEDGE, RECOMMENDATION, RISK, PREDICTION, PROPOSAL. These must never automatically become events, actions, authorization, or evidence.

## 35. GENESIS Action Boundary
Default: GENESIS → Proposal → Authorization → Action. Direct automation is allowed only through explicit pre-existing automation authorization with scope, conditions, expiry, auditability, and enforcement. GENESIS cannot manufacture authority.

## 36. External Integration Architecture
BeatOne Domain → Integration Contract → Adapter → External Provider. Categories include payments, mobile money, banks, access controllers, maps, mobility, messaging, education, healthcare, utilities, and hardware. Providers do not redefine BeatOne semantics.

## 37. External Identifier Mapping
BeatOne ID ↔ External Provider ID. Provider identifiers remain integration identifiers, not automatic canonical identity/business truth.

## 38. Webhook Architecture
External Webhook → authentication/signature validation → schema validation → idempotency → reference resolution → reconciliation → canonical event. Webhook receipt is not automatically proof of the business event.

## 39. External Failure Model
TIMEOUT, UNAVAILABLE, RATE_LIMITED, INVALID_RESPONSE, AUTHENTICATION_FAILURE, PARTIAL_SUCCESS, UNKNOWN_RESULT, RECONCILIATION_REQUIRED. UNKNOWN ≠ SUCCESS.

## 40. Reconciliation
REQUEST → external operation → UNKNOWN/PENDING → reconciliation → confirmed event. Never manufacture completion merely because an external request was sent.

## 41. Security Architecture
Identity → Authentication → Session → Authorization → Domain Validation → Execution → Audit.

## 42. Secret Management
No secrets in source, frontend bundles, logs, or commits. Environment-specific secrets are isolated and securely managed. Production credentials are not casually reused elsewhere.

## 43. Environment Separation
LOCAL/DEV, TEST, STAGING/PREVIEW, PROD are distinct. Production data and credentials are not casually reused outside production.

## 44. Deployment Architecture
Source Control → CI → Build → Verification → Deployment → Runtime → Observability. Provider-aware but product-provider-independent. Successful build ≠ runtime verification.

## 45. Cloud / Edge Separation
Central Cloud ↔ Regional/Edge ↔ Local Device/Building ↔ Physical World. Not every layer must be active initially; edge/hardware must preserve canonical identity, authorization, event, and evidence contracts.

## 46. Observability
Cover application logs, errors, metrics, traces, deployment state, integration failures, DB health, authentication/authorization failures, and external dependency failures while minimizing sensitive data.

## 47. Audit
Audit records are distinct from logs. Logs report software/runtime behavior; audit records describe consequential business activity including actor, authority, context, operation, outcome, event, evidence, and external references as applicable.

## 48. Data Privacy
Enforce purpose limitation, authorization, domain responsibility, minimum necessary access, appropriate retention, auditability, and sensitive-data protection.

## 49. Biometric Architecture
Biometrics are optional. Biometric data is not canonical identity. A biometric authentication result maps to authentication semantics and does not automatically establish business authority.

## 50. Offline Architecture
Offline operation must define cached state, offline authority, expiry, replay protection, local events, synchronization, conflicts, and reconciliation. Offline ≠ unrestricted authority.

## 51. Conflict Resolution
Resolve conflicts using authoritative server state, versions, canonical events, reconciliation rules, and human review where appropriate. Clients do not silently overwrite authoritative state.

## 52. Hardware Contract
Device → Device Identity → Device Authentication → Authorized Command → Device Execution → Device Event → Evidence. Devices cannot redefine authority.

## 53. Resource Control
Doors, water, electricity, gas, parking, equipment, facilities, and environmental infrastructure are controlled through capability + authorization. Connected device ≠ permission.

## 54. Domain Services
Payments, Economy, Services, Mobility, Commerce, Education, and Environment depend on the foundation and do not introduce competing identity, participant, or authorization systems.

## 55. Cross-Domain Transactions
Explicit ownership. Example: Commerce → Payment Intent → Payments → Payment Action → Payment Event → Evidence → Commerce Fulfillment.

## 56. Eventual Consistency
Cross-system operations expose PENDING, PROCESSING, COMPLETED, FAILED, UNKNOWN, and RECONCILIATION_REQUIRED as meaningful states. Uncertainty is not false certainty.

## 57. Migration Architecture
Migrations are versioned, reviewable, tested, environment-aware, dependency-aware, reversible where feasible, and verified. Migration state cannot outrun domain contracts.

## 58. Migration Safety
Contract Review → Schema Review → Application Compatibility → Migration Test → Rollback/Recovery → Non-prod Verification → Production Approval → Production Verification.

## 59. Legacy Code
Classify legacy material as KEEP, REPAIR, REBUILD, ADAPT, ARCHAEOLOGY ONLY, or REMOVE. Existing code is not canonical merely because it works.

## 60. Contract-First Architecture
Every foundational contract defines as applicable meaning, identifiers, required/optional data, invariants, lifecycle, authority, privacy, persistence, API, frontend behavior, GENESIS interaction, producers, consumers, failures, and tests.

## 61. Foundational Contract Order
BeatCore → People → Communities → Identity → Participant → Access → Place → Building → Floor → Unit → Resource → Relationship → Context → Capability → Authorization → Intent → Proposal → Action → Event → Evidence → GENESIS → Higher Domains.

## 62. Testing Architecture
Contract → Unit → Domain → Persistence → API → Integration → E2E → Production Verification.

## 63. Invariant Testing
Test that authentication cannot grant authorization; GENESIS cannot create authority; Proposal cannot become Action without required authorization; Action cannot automatically become confirmed Event; Event cannot automatically become Evidence; expired authorization cannot permit protected action; unauthorized actions cannot execute; external failure cannot become success; frontend cannot bypass server authorization.

## 64. Contract Drift
Detect divergence between Product Architecture, Technical Architecture, Domain Contracts, DB, API, frontend, integrations, tests, and deployment. Drift is classified and resolved, not hidden by compatibility patches.

## 65. CI Architecture
CI should verify formatting, type safety, static analysis, unit/domain/persistence/API/integration tests, build, deployment configuration, and runtime verification where supported. Green build ≠ green production system.

## 66. Deployment Verification
Verify deployment exists, expected version is deployed, runtime responds, core routes work, DB connectivity works, authentication works, authorization works, a critical domain operation behaves correctly, and no critical runtime errors are present. Only evidence-backed observations are reported as production state.

## 67. Production Safety
Production changes are deliberate, attributable, reviewable, controlled, reversible where feasible, and verified. Unrelated production mutations are prohibited during foundation work.

## 68. Source Control
Use coherent commits, e.g. docs: establish technical architecture baseline; feat(identity): establish identity contract; feat(participant): implement participant persistence; test(authz): verify authorization invariants. Avoid unrelated changes.

## 69. Branch and Change Discipline
Contract → Implementation → Tests → Verification → Dependent Layer. Dependent implementation must not compensate for an unverified foundation.

## 70. Error Model
INVALID_INPUT, UNAUTHENTICATED, UNAUTHORIZED, NOT_FOUND, CONFLICT, EXPIRED, UNAVAILABLE, TIMEOUT, DEPENDENCY_FAILURE, VALIDATION_FAILURE, INTERNAL_FAILURE, RECONCILIATION_REQUIRED. Preserve meaningful state.

## 71. Security Failure Behavior
Security-sensitive failures fail safely. Unavailable authorization/access/payment confirmation/GENESIS data must not silently allow, confirm, or fabricate success.

## 72. Data Retention
Retention is domain-specific and considers legal, operational, privacy, audit, security, and contractual requirements. No indefinite retention by default.

## 73. Architectural Telemetry
Monitor authorization failures, duplicate commands, event reconciliation, integration failures, stale reads, migration failures, contract-test failures, API/runtime errors, and data-integrity failures.

## 74. Technical Invariants
T1 one canonical identity model; T2 one participant model; T3 one authorization model; T4 one lifecycle model; T5 one event model; T6 one evidence model; T7 one authoritative business-truth source per domain; T8 frontend is not security authority; T9 GENESIS has no inherent authority; T10 providers do not redefine semantics; T11 consequential operations are retry-safe where required; T12 unknown remains unknown; T13 production state is never fabricated; T14 migrations are controlled; T15 lower layers cannot redefine higher architecture.

## 75. Non-Goals
This baseline does not yet choose programming language, framework, ORM, database vendor, authentication vendor, AI model/provider, payment provider, cloud provider, frontend library, or hardware platform. Those are later decisions subordinate to this architecture.

## 76. Architecture Decision Records
Significant technical decisions use: Decision, Context, Options, Chosen approach, Reasons, Consequences, Reversibility, Date, Status. ADRs cannot silently override Product or Technical Architecture Baselines.

## 77. Architecture Change Control
Classify changes as PRODUCT, TECHNICAL, DOMAIN CONTRACT, DATA, API, EXPERIENCE, INTEGRATION, or INFRASTRUCTURE. A technical change that alters product meaning returns to Product Architecture review.

## 78. Foundation Completion Gate
A layer is complete only after Contract → Implementation → Persistence → API if required → Tests → Invariants → Integration → Runtime Verification. Compilation alone is not completion.

## 79. Verification States
🟢 VERIFIED = directly verified by evidence; 🟡 SUPPORTED = supported but not fully verified; 🔵 PROPOSED = designed but not executed/verified; 🔴 FAILED = verification failed. No state upgrades without evidence.

## 80. System Reconciliation Requirement
Before new foundation implementation, inspect duplicate/competing contracts, contradictory semantics, dead code, stale migrations, competing identity/auth, hidden persistence, direct DB writes, API bypasses, frontend business logic, event fabrication, evidence confusion, GENESIS authority leakage, naming inconsistencies, broken tests, and deployment drift.

## 81. Foundation-First Execution Stages
0 Repository Reconnaissance; 1 Technical Architecture; 2 BeatCore; 3 People + Communities; 4 Identity + Participant; 5 Access; 6 Place/Building/Floor/Unit/Resource; 7 Relationship + Context; 8 Capability + Authorization; 9 Intent + Proposal; 10 Action; 11 Event; 12 Evidence; 13 GENESIS; 14 Higher Domains; 15 OneApp + Website; 16 Integrations; 17 Infrastructure Hardening.

## 82. Stage 0 — Repository Reconnaissance
Inspect repository structure, source, tests, configuration, dependencies, database, migrations, API, authentication, authorization, persistence, frontend, deployment, CI, environment configuration, and documentation. Classify before modification.

## 83. Reconciliation Classification
CANONICAL, SUPPORTED, STALE, CONTRADICTORY, DUPLICATE, BROKEN, LEGACY, UNUSED, REMOVE, UNKNOWN.

## 84. No Random Patching
Failure → Locate Contract → Identify Owner → Find Root Cause → Repair → Test → Recheck Dependents. A symptom patch cannot substitute for repairing the responsible contract.

## 85. Foundation Stop Conditions
Stop and return to architecture review if there are competing identity/auth models, contradictory event semantics, persistence unable to represent the contract, legacy behavior contradicting invariants, external systems treated as canonical business truth, GENESIS authority, frontend compensation for missing authoritative backend logic, or migrations contradicting contracts.

## 86. Success Condition
The foundation is coherent only when the system can clearly answer where identity, participation, authorization, domain truth, actions, events, evidence, GENESIS, integrations, OneApp/Website truth, consequential verification, and production-change control live.

## 87. Final Technical Principle
ONE CANONICAL PRODUCT MEANING → ONE TECHNICAL FOUNDATION → ONE IDENTITY MODEL → ONE PARTICIPANT MODEL → ONE CONTEXT MODEL → ONE AUTHORIZATION MODEL → ONE LIFECYCLE → ONE EVENT → ONE EVIDENCE MODEL → MANY AUTHORIZED CAPABILITIES → ONEAPP + PLATFORM WEBSITE → EXTERNAL WORLD.

**Implementation principle:** Understand the system first. Define the contract second. Implement third. Verify fourth. Integrate fifth. Expand only after the foundation is proven.

## 88. Execution Gate
After this baseline: (1) commit Technical Architecture Baseline; (2) full BeatOne repository reconnaissance; (3) Technical Reconciliation Report; (4) freeze verified technical starting state; (5) BeatCore Contract; (6) implement/verify BeatCore; (7) People + Communities contracts; (8) implement/verify; (9) Identity + Participant contracts; (10) implement/verify; (11) continue bottom-up. No dependent layer is skipped merely for visible UI.

## 89. Current Architecture State
- Product Architecture Baseline v1.0: 🟢 EXECUTED / COMMITTED
- Technical Architecture Baseline v1.0: 🟢 EXECUTED / COMMITTED
- Repository reconciliation: 🔵 NOT STARTED
- Technical implementation: 🔵 NOT STARTED
- Production changes: 🟢 NONE
- Production migrations: 🟢 NONE
- Legacy adoption: 🟢 NONE
- GENESIS implementation: 🔵 NOT STARTED
- OneApp implementation: 🔵 NOT STARTED
- Platform Website implementation: 🔵 NOT STARTED

## 90. Control Statement
Until explicitly revised, implementation follows this Technical Architecture Baseline and the frozen Product Architecture Baseline.

**One canonical product meaning → one technical foundation → one identity model → one participant model → one context model → one authorization model → one lifecycle → one event → one evidence model → many authorized capabilities → OneApp + Platform Website → external world.**
