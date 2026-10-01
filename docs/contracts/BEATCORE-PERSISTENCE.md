# BeatCore Persistence Representation

**Status:** FROZEN AFTER APPROVAL  
**Scope:** BeatCore persistence representation only  
**Database vendor:** intentionally unspecified

## 1. Purpose
This document defines the first concrete persistence representation for the frozen BeatCore contract.
It answers what must be persisted and how canonical ownership and relationships are represented without selecting a database vendor, ORM, migration tool, or deployment provider.
The persistence layer implements BeatCore. It does not redefine BeatCore.

## 2. Canonical ownership
| Representation | Owner | Primary identity |
|---|---|---|
| persons | BeatCore / People | person.id |
| communities | BeatCore / Communities | community.id |
| identities | BeatCore / Identity | identity.id |
| accounts | BeatCore / Identity | account.id |
| credentials | BeatCore / Identity | credential.id |
| sessions | BeatCore / Identity | session.id |
| participants | BeatCore / Participant | participant.id |
| accesses | BeatCore / Access | access.id |
| places | BeatCore / Place | place.id |
| contexts | BeatCore / Context | context.id |
| relationships | BeatCore / Relationship | relationship.id |
| capabilities | BeatCore / Capability | capability.id |
| authorizations | BeatCore / Authorization | authorization.id |
| intents | BeatCore / Intent | intent.id |
| proposals | BeatCore / Proposal | proposal.id |
| actions | BeatCore / Action | action.id |
| events | BeatCore / Event | event.id |
| evidences | BeatCore / Evidence | evidence.id |

No second foundational identity, participant, authorization, action, event, or evidence store is introduced.

## 3. Representation rules
1. Every canonical record has a stable opaque primary identifier.
2. Canonical IDs are stored as identifiers, not as authorization-bearing values.
3. Required relationships are represented by references.
4. Optional relationships remain nullable/absent; they are not fabricated.
5. Lifecycle state is persisted explicitly.
6. Temporal validity is persisted explicitly.
7. Event occurrence time is distinct from action state.
8. Evidence verification is distinct from event state.
9. External provider references remain secondary integration identifiers.
10. Correlation and causation identifiers remain trace metadata, not business identity.
11. Read models, caches, search indexes, and analytics are not canonical truth.
12. Direct cross-domain writes must respect the owning contract.
13. Schema constraints may strengthen integrity but may not change product meaning.

## 4. Canonical tables

### persons
- id primary key.

### communities
- id primary key.
- name required.

### identities
- id primary key.
- kind required.
- person_id optional reference to persons.id.

### accounts
- id primary key.
- identity_id required reference to identities.id.
- status required.

### credentials
- id primary key.
- account_id required reference to accounts.id.
- kind required.
- status required.

### sessions
- id primary key.
- account_id required reference to accounts.id.
- authenticated_at required timestamp.
- expires_at required timestamp.

### participants
- id primary key.
- identity_id required reference to identities.id.
- community_id optional reference to communities.id.
- context_id optional reference to contexts.id.

### accesses
- id primary key.
- participant_id required reference to participants.id.
- target_type required canonical Access target category.
- target_id required target identifier.
- mode required canonical Access mode.

### places
- id primary key.
- kind required canonical Place kind.
- parent_id optional for PLACE and BUILDING; required for FLOOR, UNIT, and RESOURCE.
- parent_id references places.id when present.
- parent kind must follow PLACE → BUILDING → FLOOR → UNIT → RESOURCE.

### contexts
- id primary key.
- participant_id required reference to participants.id.
- place_id optional reference to places.id.
- community_id optional reference to communities.id.
- purpose optional.

### relationships
- id primary key.
- subject_id required canonical entity reference.
- target_id required canonical entity reference.
- kind required.
- valid_from required timestamp.
- valid_until optional timestamp.
Subject/target remain generic canonical entity references because the BeatCore contract permits relationships among multiple entity types. The persistence layer must not invent an artificial person-only relationship model.

### capabilities
- id primary key.
- name required.

### authorizations
- id primary key.
- decision required.
- actor_id required reference to identities.id.
- participant_id optional reference to participants.id.
- context_id optional reference to contexts.id.
- relationship_id optional reference to relationships.id.
- capability_id required reference to capabilities.id.
- valid_from required timestamp.
- valid_until optional timestamp.
- scope optional.
- delegated_by optional reference to identities.id.

### intents
- id primary key.
- actor_id required reference to identities.id.
- purpose required.
- context_id optional reference to contexts.id.

### proposals
- id primary key.
- actor_id required reference to identities.id.
- intent_id required reference to intents.id.
- summary required.
- authorization_id optional reference to authorizations.id.
A proposal may exist without authorization. It must never be persisted as an action merely because it contains an intended operation.

### actions
- id primary key.
- actor_id required reference to identities.id.
- proposal_id optional reference to proposals.id.
- authorization_id required reference to authorizations.id.
- state required lifecycle state.
- operation required.
- context_id optional reference to contexts.id.
- correlation_id optional trace identifier.
- idempotency_key optional.
An action cannot omit its authorization basis.

### events
- id primary key.
- action_id optional reference to actions.id.
- type required.
- occurred_at required timestamp.
- state required lifecycle state.
- actor_id optional reference to identities.id.
- context_id optional reference to contexts.id.
- source required.
- correlation_id optional trace identifier.
- causation_id optional event/action trace identifier.
- version required positive integer.
An event is not a copy of an action and is not evidence.

### evidences
- id primary key.
- event_id optional reference to events.id.
- source required.
- verification required.
- recorded_at required timestamp.
- external_provider optional.
- external_reference optional.
External provider/reference pairs remain secondary identifiers and must not become canonical entity IDs.

## 5. Integrity constraints
The persistence implementation must enforce, as applicable:
- primary-key uniqueness;
- referenced-record existence for declared foreign keys;
- lifecycle values from the canonical lifecycle set;
- authorization decisions from the canonical decision set;
- evidence verification values from the canonical verification set;
- non-empty required identifiers/text;
- valid timestamp representation;
- positive event version;
- uniqueness of idempotency keys within the consequential-operation scope defined by the Action contract;
- uniqueness of external provider/reference pairs where the integration contract requires it.
A database constraint must not be used to silently convert an invalid state into a different valid semantic state.

## 6. Transaction boundary
For a consequential local operation, the persistence transaction must be capable of preserving the required atomic local boundary:

validation → authorization → state transition → persist → event recording

External provider operations are outside the local atomic boundary.
If an external outcome is unknown, persistence must retain an explicit pending/unknown/reconciliation-required state rather than manufacturing completion.

## 7. Index requirements
The eventual implementation should index, as justified by workload and authorization needs:
- identity references;
- participant identity/community/context;
- authorization actor/participant/context/capability and validity window;
- action actor/authorization/state/idempotency/correlation;
- event action/type/occurrence/correlation/causation;
- evidence event/verification/external reference.
Indexes are retrieval mechanisms and never become competing business truth.

## 8. Migration boundary
This representation is not a production migration.
No database vendor, connection, migration runner, deployment environment, or production schema is introduced by this stage.
A later physical schema/migration implementation must pass:

Contract Review → Schema Review → Application Compatibility → Migration Test → Rollback/Recovery → Non-prod Verification → Production Approval → Production Verification

## 9. Completion gate for this stage
This persistence representation is complete for the current foundation stage only when:
- canonical ownership is explicit;
- every BeatCore canonical entity has a persistence representation;
- identity/participant/authorization/action/event/evidence separation is preserved;
- required relationships are represented;
- lifecycle and temporal semantics are representable;
- external identifiers remain secondary;
- transaction and idempotency boundaries are representable;
- no production database or migration is implied.
The next layer may implement a concrete repository/database adapter only after this representation is verified.