# Full System Bottom-Up Reconciliation — 2026-10-02

**Status:** 🟡 SUPPORTED — APPLICATION/TEST FOUNDATION GREEN; PRODUCTION PHYSICAL FOUNDATION RECONCILIATION REQUIRED
**Fresh production recheck:** 2026-10-02 — read-only Neon inspection
**Scope:** BeatOne from Product/Technical foundation through current Action, Payments, Event/Evidence runtime state
**Production:** Neon project Zalagren / production branch / neondb
**Rule:** no production Event/Evidence migration is authorized by this document.

## 1. Executive result

A fresh bottom-up review was performed instead of treating the latest Event/Evidence stage as the whole system.

The application/domain foundation is currently coherent and the latest Event/Evidence runtime verification passed. Action and Payments physical migrations are present in production.

The review found a separate, material production failure boundary upstream of Event/Evidence:

**the production physical schemas for several foundational entities still use legacy representations that do not match the frozen canonical BeatCore persistence contracts.**

This means the application contracts can be green while the complete production persistence chain is not yet green.

## 2. Verified green layers

- BeatCore semantic foundation
- People + Communities
- Identity + Participant application contract
- Access
- Place
- Relationship + Context
- Capability + Authorization
- Intent + Proposal
- Action application contract and runtime semantics
- Payments application/persistence contract
- GENESIS non-authoritative intelligence boundary
- Integration provider-neutral boundary
- Experience boundary
- Action physical production migration
- Payments physical production migration
- Event → Evidence isolated PostgreSQL runtime verification

The final Event/Evidence runtime verification passed GitHub Actions run #218, including the BeatCore test suite, typecheck, PostgreSQL Event/Evidence runtime test, and PostgreSQL Payments regression runtime test.

## 3. Production physical failure found

The current public production schema was inspected read-only.

### Identity / Participant

Canonical persistence expects:
- identities: id, kind, optional person_id
- participants: id, identity_id, optional community_id/context_id

Production currently has:
- identities: id, participant_id, status, created_at
- participants: id, display_name, status, created_at

The canonical Identity → Participant representation therefore cannot be treated as physically reconciled.

Fresh read-only production recheck shows `identities = 0` and `participants = 0`. The physical schema is still legacy-shaped, but the previously observed Identity/Participant data rows are no longer present. Therefore the already-rehearsed zero-data migration is applicable to the current production state; no data-mapping transformation is required at this checkpoint.

### Accounts / Credentials / Sessions

The canonical persistence representation defines BeatCore-owned accounts, credentials, and sessions.

Those canonical public tables are not present.

Separate authentication-related tables exist (auth_methods, auth_sessions, and Neon Auth tables), but they cannot be silently declared equivalent to the canonical BeatCore persistence representations. Authentication and canonical Identity/Account/Credential/Session semantics must be reconciled explicitly.

### Access

The canonical persistence representation defines accesses.

No public accesses table currently exists.

### Place

The canonical representation requires a canonical kind and the defined Place hierarchy semantics.

Production places uses the legacy type representation and additional legacy fields. This requires physical-schema reconciliation before it can be treated as canonical.

### Relationship

Canonical persistence requires subject_id, target_id, kind, valid_from, and optional valid_until.

Production uses subject_id, object_id, relationship_type, status, and nullable valid_from, with additional legacy semantics.

This is a semantic/physical mismatch, not merely a naming difference.

### Context

Canonical persistence requires participant linkage with optional Place/Community and optional purpose.

Production adds required/legacy fields including role, active_at, resource_id, and a JSON state representation, while purpose is physically required.

This requires reconciliation before canonical physical status can be claimed.

### Capability

Canonical persistence is intentionally small: id + name.

Production requires additional service/action/role/resource fields and a service FK.

That physical schema currently encodes higher-domain/legacy semantics that are not part of the frozen foundational Capability contract.

### Authorization

This is the most consequential upstream mismatch.

Canonical Authorization requires:
- id
- decision
- actor_id
- optional participant/context/relationship
- capability_id
- valid_from
- optional valid_until
- optional scope
- optional delegated_by

Production instead contains legacy fields such as participant_id, context_id, capability_id, action, source, expires_at, status, issued_by_participant_id, revoked_at, and proposal_id, and does not contain the canonical actor/decision/valid_from representation.

The live constraint set also contains legacy composite relationships across capabilities, contexts, proposals, and participants.

Therefore the canonical Action/Payments production FKs now point at an authorizations table that is not yet physically canonical.

Because production authorizations currently contain zero rows, no bad canonical Authorization data has been written, but the physical chain is still not ready for real canonical authorization-backed operations.

### Intent / Proposal

Canonical Intent requires actor_id + purpose + optional context.

Production Intent uses participant_id/context_id/description with those fields required.

Canonical Proposal requires actor_id + intent_id + summary + optional authorization.

Production Proposal requires context/capability/execution fields and does not expose the canonical actor_id representation.

These are separate physical contract mismatches.

### Event / Evidence

Production events, evidence, and event_evidence remain legacy physical representations.

Their runtime application/isolated-PostgreSQL verification is green, but production physical canonicalization is still not ready.

## 4. Downstream production state

Current production counts from the fresh read-only recheck are:
- identities: 0
- participants: 0
- actions: 0
- payments: 0
- events: 0
- evidence: 0
- event_evidence: 0
- authorizations: 0
- capabilities: 0
- intents: 0
- proposals: 0

The migration ledger was freshly re-read and contains 11 applied entries: the approved historical migrations through 022_cross_entity_lifecycle_integrity, followed by:
- action-physical-canonicalization-2026-10-02
- payments-physical-canonicalization-2026-10-02

No Event/Evidence physical migration is registered.

The Identity/Participant migration is committed in the repository and has been successfully rehearsed on disposable Neon branch `br-blue-glade-b5pdci8h`; it is not present in the production migration ledger.

## 5. What was NOT changed

This reconciliation did not:
- mutate production;
- rewrite or delete the 22 existing Identity/Participant rows;
- create a speculative migration;
- reinterpret Neon Auth as BeatCore Account/Credential/Session truth;
- alter Action or Payments production schemas;
- execute Event/Evidence production migration;
- add a provider;
- add UI;
- add hardware;
- give GENESIS authority.

## 6. Required correction

The correct repair is not to weaken the application contracts to fit the legacy production tables. The current production database has zero rows in the affected Identity/Participant tables, so the prepared narrow physical migration can be applied without a data transformation, subject to the production-change approval gate.

The physical layer must be brought into explicit canonical alignment through controlled reconciliation:

Identity/Participant physical schema → Account/Credential/Session boundary → Access physical schema → Place → Relationship/Context → Capability → Authorization → Intent/Proposal → producer compatibility → disposable PostgreSQL migration rehearsal → production-readiness gates

Only after the upstream chain is physically canonical should Event/Evidence production migration readiness be reopened.

## 7. Important sequencing correction

The previous next-stage assumption of moving directly from green Event/Evidence runtime verification to Event/Evidence production migration is superseded by this fresh finding.

The system is green at the application/runtime verification layer, but **not green as a complete production persistence architecture**.

The next exact stage is therefore:

**FOUNDATION PHYSICAL PERSISTENCE FULL RECONCILIATION — IDENTITY → PARTICIPANT → ACCOUNT/CREDENTIAL/SESSION → ACCESS → PLACE → RELATIONSHIP → CONTEXT → CAPABILITY → AUTHORIZATION → INTENT → PROPOSAL**

No production migration beyond the already-proven Identity/Participant step should be executed until the remaining upstream physical chain is reconciled. The immediate production gate is now the already-rehearsed Identity → Participant migration.