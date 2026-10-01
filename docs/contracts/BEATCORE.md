# BeatCore Contract v1.0

**Status:** FROZEN AFTER APPROVAL  
**Layer:** Foundational Technical Contract  
**Canonical path:** `docs/contracts/BEATCORE.md`

## 1. Purpose

BeatCore is the canonical technical foundation of BeatOne. It establishes the shared semantic and execution boundary on which People, Communities, Identity, Participant, Access, Place, Relationship, Context, Capability, Authorization, Intent, Proposal, Action, Event, Evidence, GENESIS, higher domains, OneApp, and Platform Website depend.

BeatCore is not a UI framework, database schema, authentication vendor, payment provider, AI provider, or deployment product.

## 2. Authority

This contract is subordinate to:

1. Product Architecture Baseline v1.0.
2. Technical Architecture Baseline v1.0.

All implementation, persistence, API, frontend, integration, and infrastructure decisions must preserve this contract. A lower layer may not redefine BeatCore semantics.

## 3. Canonical Boundary

BeatCore owns the canonical meaning and invariants for:

- People
- Communities
- Identity
- Participant
- Access
- Place
- Building
- Floor
- Unit
- Resource
- Relationship
- Context
- Capability
- Authorization
- Intent
- Proposal
- Action
- Event
- Evidence

BeatCore provides shared primitives for identifiers, actor attribution, context, lifecycle state, temporal validity, correlation, auditability, errors, and integrity.

BeatCore does not own the detailed business semantics of Payments, Economy, Services, Mobility, Commerce, Education, Environment, or other higher domains. Those domains consume BeatCore contracts.

## 4. Canonical Dependency Direction

```
BeatCore
  → People
  → Communities
  → Identity
  → Participant
  → Access
  → Place
  → Building
  → Floor
  → Unit
  → Resource
  → Relationship
  → Context
  → Capability
  → Authorization
  → Intent
  → Proposal
  → Action
  → Event
  → Evidence
  → GENESIS
  → Higher Domains
  → API/Application
  → OneApp + Platform Website
  → Integrations
  → Infrastructure
```

The sequence describes dependency direction, not a requirement that every operation instantiate every concept.

## 5. Core Entity Rules

### 5.1 Person

A Person represents an individual human participant subject.

A Person does not inherently possess authority merely by existing or being authenticated.

### 5.2 Community

A Community represents a voluntarily participating collective context.

Community membership does not imply unrestricted authority.

### 5.3 Identity

Identity represents the canonical actor identity recognized by BeatOne.

Identity answers **who or what is participating**.

Identity does not answer what that actor is permitted to do.

### 5.4 Participant

Participant represents an Identity participating in a specific context.

Participant is first-class.

The same identity may have multiple contextual participations without creating competing identities.

### 5.5 Access

Access represents interaction with a place, resource, service, capability, or controlled boundary.

An access mechanism may be password, passkey, device, PIN, QR, NFC, wearable, fingerprint, face, palm, or another mechanism. The mechanism does not define business authority.

### 5.6 Place

Place represents a physical or logical location.

### 5.7 Building / Floor / Unit / Resource

The canonical physical hierarchy is:

```
Build Phase → Building → Floor → Unit → Resource
```

Resource may represent water, electricity, gas, energy, equipment, parking, shared facilities, environmental infrastructure, or digital resources.

### 5.8 Relationship

Relationship represents a meaningful association between actors, communities, places, units, resources, or other canonical entities.

Relationship may support context or authorization evaluation but is not itself authorization.

### 5.9 Context

Context represents the circumstances under which an operation is evaluated.

Relevant dimensions may include participant, community, place, time, relationship, capability, purpose, resource, service, authorization, and environment.

Context is explicit where it materially affects authority or outcome.

### 5.10 Capability

Capability represents what an actor or system may potentially do.

Capability is not permission.

### 5.11 Authorization

Authorization represents an explicit, attributable, bounded decision that an operation is permitted.

Authorization may depend on:

- actor and identity
- participant
- context
- relationship
- capability
- policy
- time
- scope
- delegation
- community rules
- explicit approval

Authorization is revocable, auditable, and time/scope aware.

### 5.12 Intent

Intent represents what an actor seeks to accomplish.

Intent does not execute an operation.

### 5.13 Proposal

Proposal represents a proposed course of action.

A proposal may contain intended outcome, proposed action, context, assumptions, evidence, required authorization, constraints, consequences, and alternatives.

Proposal does not execute.

### 5.14 Action

Action represents an operation that was actually accepted for execution under the applicable authorization boundary.

An Action must be attributable and traceable.

### 5.15 Event

Event represents a recognized occurrence.

An Event is not merely a request, proposal, or attempted operation.

An Event must represent an actual recognized state transition or occurrence according to its domain contract.

### 5.16 Evidence

Evidence represents information that substantiates an actual state or occurrence.

Evidence may originate from BeatOne records, devices, providers, documents, sensors, humans, or signed records.

Evidence is not authorization, intent, proposal, action, or prediction.

## 6. Canonical Lifecycle

The conceptual lifecycle is:

```
Identity
→ Participant
→ Community / Place / Context
→ Relationship
→ Capability
→ Authorization
→ Intent
→ Proposal
→ Action
→ Event
→ Evidence
```

Not every command requires every stage, but no implementation may collapse distinct meanings merely for convenience.

## 7. Identity and Account Separation

The following are distinct:

```
Identity ≠ Account
Account ≠ Credential
Credential ≠ Session
Session ≠ Authorization
Authentication ≠ Authorization
```

Authentication establishes an authenticated session or actor assertion.

Authorization determines whether the requested operation is permitted.

No provider-specific credential model becomes the canonical business identity model.

## 8. Actor Attribution

Every consequential operation must be attributable to an actor.

At minimum, the system must be able to associate an operation with:

- actor/identity
- participant when applicable
- authorization basis
- context when applicable
- operation/action identifier
- resulting event when one occurs

Anonymous technical requests may exist at transport level but cannot silently become unattributed consequential business actions.

## 9. Identifier Rules

Every canonical entity requires a stable BeatOne-owned identifier.

External provider identifiers are secondary references.

Canonical identity mapping is:

```
BeatOne ID ↔ External Provider ID
```

An external provider ID must not silently become the BeatOne canonical identifier.

Identifiers must be opaque to business meaning where practical and must not encode authorization.

## 10. Temporal Rules

Authority and contextual relationships may be:

- permanent
- temporary
- scheduled
- conditional
- delegated
- event-bound
- revocable

Expired authority is not active authority.

An implementation must evaluate validity at the point where authority matters.

## 11. Delegation

Delegation must identify:

- delegator
- delegate
- scope
- purpose where required
- duration
- conditions
- revocation state
- audit trail

Delegation cannot exceed the authority being delegated.

## 12. Authorization Boundary

The canonical decision shape is:

```
Actor
+ Identity
+ Participant
+ Context
+ Relationship
+ Capability
+ Policy
+ Time/Scope
+ Delegation
→ Authorization Decision
```

Possible outcomes include:

- ALLOW
- DENY
- CONDITIONAL

The decision must be enforced server-side or at the authoritative execution boundary.

Frontend state is never the final security authority.

## 13. Command and Query Boundary

A Command requests a state-changing operation.

A Query retrieves information without changing canonical business state.

Commands must pass:

1. input validation
2. authentication where required
3. context resolution
4. authorization
5. domain validation
6. persistence
7. event handling where applicable
8. audit handling where applicable

Queries must apply applicable access controls and must not mutate canonical state.

## 14. Action Contract

An Action must contain enough information to establish:

- action identifier
- actor
- participant when applicable
- operation type
- target
- context
- authorization basis
- lifecycle state
- timestamps
- correlation information
- outcome or failure state

An accepted request is not automatically a completed Action.

## 15. Event Contract

A canonical Event must have, as applicable:

- event identifier
- event type
- occurrence timestamp
- actor/source
- related entity
- context
- correlation identifier
- causation identifier
- action identifier when applicable
- schema/version
- integrity information
- event state appropriate to the domain

A receipt, request, prediction, or proposal must not be represented as a completed domain Event unless the domain contract explicitly defines it as such.

## 16. Evidence Contract

Evidence must identify, where applicable:

- evidence identifier
- source
- source type
- related event/action
- captured or issued time
- verification state
- external reference
- integrity/provenance information

Evidence may be pending verification.

Unverified evidence must not be represented as verified evidence.

## 17. Real-World State

BeatCore distinguishes:

```
Desired State
Authorized State
Attempted Action
Actual Event
Evidenced State
```

These states must not be collapsed into one status field when doing so would create false certainty.

## 18. Failure and Unknown State

Canonical failure categories include:

- INVALID_INPUT
- UNAUTHENTICATED
- UNAUTHORIZED
- NOT_FOUND
- CONFLICT
- EXPIRED
- UNAVAILABLE
- TIMEOUT
- DEPENDENCY_FAILURE
- VALIDATION_FAILURE
- INTERNAL_FAILURE
- RECONCILIATION_REQUIRED

External UNKNOWN_RESULT remains unknown until reconciliation establishes the outcome.

Failure is never silently converted into success.

## 19. Lifecycle States

Where a state machine is required, implementations may use the canonical semantic states:

```
REQUESTED
AUTHORIZED
PROCESSING
COMPLETED
DENIED
REJECTED
FAILED
EXPIRED
CANCELLED
PARTIAL
DISPUTED
REVERSED
RECONCILED
```

A domain may use a smaller subset when its contract does not require the others.

## 20. Idempotency

Operations with real-world or consequential effects must be retry-safe.

Idempotency must be considered for:

- payments
- access operations
- reservations
- service operations
- external commands
- webhook processing
- reconciliation

Retries must not create duplicate consequential outcomes.

## 21. Correlation and Causation

Where relevant, BeatCore operations use distinct identifiers for:

- request_id
- correlation_id
- causation_id
- action_id
- event_id
- evidence_id
- external_reference

These identifiers must not be treated as interchangeable.

## 22. Persistence Contract

Persistence is the durable implementation of canonical domain truth.

Persistence must preserve:

- identity integrity
- relationships
- authorization validity
- lifecycle state
- temporal boundaries
- uniqueness
- referential integrity where appropriate
- auditability
- event/evidence distinction
- migration compatibility

The database must not redefine canonical semantics.

## 23. Persistence Ownership

Canonical ownership follows the domain:

- Identity owns identity records.
- Participant owns participation records.
- Authorization owns authorization records.
- Action owns action records.
- Event owns event records.
- Evidence owns evidence records.
- Higher domains own their domain-specific state.

Consumers may reference canonical records but must not create competing copies that become authoritative.

## 24. Read Models

Read models, projections, caches, analytics models, and search indexes may optimize retrieval.

They are not competing sources of canonical truth.

A stale read must be distinguishable where freshness materially affects a decision.

## 25. API Boundary

API/application layers expose canonical operations without redefining them.

API handlers must not:

- bypass authorization
- directly fabricate events
- treat frontend state as truth
- create hidden business semantics
- write competing identity models
- use provider IDs as canonical identity
- silently convert external failure into success

## 26. Surface Boundary

OneApp and Platform Website are consumers of the same BeatCore semantics.

Neither surface owns:

- identity truth
- participant truth
- authorization truth
- action truth
- event truth
- evidence truth
- domain ownership

Surface-specific presentation state must not become business truth.

## 27. GENESIS Boundary

GENESIS consumes permitted canonical information and context.

Canonical intelligence flow:

```
Canonical Data
→ Permitted Context
→ GENESIS
→ Knowledge / Intelligence
→ Proposal
→ Authorization Boundary
→ Action
```

GENESIS may produce:

- observation
- insight
- knowledge
- recommendation
- risk
- prediction
- proposal

GENESIS must not:

- manufacture authority
- escalate privileges
- bypass authorization
- fabricate events
- fabricate evidence
- present predictions as actual events
- silently convert proposals into consequential actions

## 28. Higher Domain Boundary

Payments, Economy, Services, Mobility, Commerce, Education, Environment, and future domains consume BeatCore.

They may introduce domain-specific entities and workflows but must preserve BeatCore identity, participant, context, capability, authorization, action, event, and evidence semantics.

No higher domain may create a second foundational identity or authorization system.

## 29. Integration Boundary

External systems are adapters behind explicit contracts:

```
BeatOne Domain
→ Integration Contract
→ Adapter
→ External Provider
```

Provider semantics do not redefine BeatCore.

Provider confirmation is evidence only to the extent established by the relevant reconciliation contract.

## 30. Transaction Boundary

A canonical transaction may include:

```
Validate
→ Authorize
→ Change Domain State
→ Persist
→ Record Event
→ Record/Link Evidence
```

External operations are not assumed to be atomically transactional with local persistence.

Unknown external outcomes must enter reconciliation rather than false completion.

## 31. Privacy

BeatCore implementations must apply:

- purpose limitation
- minimum necessary data
- authorization-aware access
- domain ownership
- retention controls
- auditable consequential access

No social scoring is permitted as a foundational mechanism.

Biometric data is optional and is not the canonical identity model.

## 32. Security

The security sequence is:

```
Identity
→ Authentication
→ Session
→ Authorization
→ Domain Validation
→ Execution
→ Audit
```

Secrets must never be committed to source, embedded in client code, or exposed through logs.

Security failure must fail safely.

## 33. Offline and Edge

Offline or edge operation may exist only within explicit authority, expiry, replay, synchronization, conflict, and reconciliation contracts.

Offline capability does not imply unrestricted authority.

## 34. Device and Physical Execution

Physical control follows:

```
Device
→ Device Identity
→ Device Authentication
→ Authorized Command
→ Device Execution
→ Device Event
→ Evidence
```

A device signal does not by itself establish business authorization.

## 35. Invariants

The following are non-negotiable BeatCore invariants:

1. Identity ≠ Authority.
2. Authentication ≠ Authorization.
3. Participant is first-class.
4. Participation is contextual.
5. Capability ≠ Authorization.
6. Intent ≠ Proposal.
7. Proposal ≠ Action.
8. Action ≠ Event.
9. Event ≠ Evidence.
10. Expired authorization cannot remain effective.
11. Unauthorized consequential operations are blocked.
12. GENESIS cannot manufacture authority.
13. External provider semantics do not redefine BeatCore.
14. Unknown outcomes remain unknown until reconciled.
15. Frontend state cannot bypass authoritative enforcement.
16. Failed operations cannot silently become successful events.
17. Canonical entities have one authoritative owner.
18. Read models cannot become competing truth.
19. Consequential operations are attributable.
20. Real-world claims require appropriate evidence.
21. Lower technical layers cannot redefine higher architectural contracts.
22. No implementation may introduce a second foundational identity or authorization model.

## 36. Producer and Consumer Rules

Every BeatCore concept must have an explicit owner.

Producers must satisfy the canonical contract before emitting state consumed by another domain.

Consumers must depend on the canonical contract rather than implementation details.

Direct cross-domain database writes are prohibited unless explicitly justified by the owning contract.

## 37. Contract Versioning

Breaking semantic changes require:

- architecture review
- contract version decision
- affected producer/consumer analysis
- persistence impact analysis
- migration plan when required
- test updates
- runtime verification

A convenient implementation change is not sufficient justification for changing canonical meaning.

## 38. Testing Contract

Before a BeatCore layer is considered complete, verification must cover:

- contract tests
- unit tests
- domain behavior
- persistence behavior
- authorization behavior where applicable
- lifecycle transitions
- failure paths
- idempotency where applicable
- invariant tests
- integration behavior where applicable

The minimum gate is:

```
Contract
→ Implementation
→ Persistence
→ Tests
→ Invariants
→ Verification
```

## 39. Required Invariant Tests

At minimum, the implementation must prove:

- unauthenticated access is rejected where required
- unauthorized access is rejected
- expired authorization is rejected
- capabilities do not bypass authorization
- proposal cannot become action without required authority
- action is not automatically treated as event
- event is not automatically treated as evidence
- external failure is not represented as success
- unknown external outcome remains unknown
- retry does not duplicate consequential operations
- frontend cannot bypass server/domain authorization
- GENESIS output cannot directly manufacture authority

## 40. Implementation Gate

BeatCore implementation must not begin by creating broad application architecture.

The first implementation must establish only the minimum coherent BeatCore boundary required by this contract.

Implementation order:

1. Canonical types/value objects and identifiers.
2. Core domain entities and ownership.
3. Invariants and validation.
4. Persistence representation.
5. Domain operations.
6. Tests.
7. Verification.
8. Only then expose required application/API boundaries.

## 41. Explicit Non-Goals

This contract does not choose:

- programming language
- framework
- ORM
- database vendor
- authentication vendor
- AI provider
- payment provider
- cloud provider
- frontend framework
- hardware platform

Those choices must remain subordinate to the contract.

## 42. Completion Gate

BeatCore is not complete merely because code compiles.

BeatCore completion requires:

```
Contract
→ Implementation
→ Persistence
→ Tests
→ Invariants
→ Integration
→ Runtime Verification
```

The implementation must be demonstrably consistent with Product Architecture, Technical Architecture, and this contract.

## 43. Canonical Principle

```
ONE CANONICAL PRODUCT MEANING
→ ONE TECHNICAL FOUNDATION
→ ONE IDENTITY MODEL
→ ONE PARTICIPANT MODEL
→ ONE CONTEXT MODEL
→ ONE AUTHORIZATION MODEL
→ ONE LIFECYCLE
→ ONE EVENT MODEL
→ ONE EVIDENCE MODEL
→ MANY AUTHORIZED CAPABILITIES
→ ONEAPP + PLATFORM WEBSITE
→ EXTERNAL WORLD
```

**BeatCore exists to keep the ecosystem coherent as the system grows.**
