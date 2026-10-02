# Identity + Participant Persistence Reconciliation

**Status:** 🟡 PHYSICAL RECONCILIATION REHEARSED — PRODUCTION NOT APPLIED  
**Scope:** Identity + Participant  
**Date:** 2026-10-02

## 1. Canonical DB-Neutral Representation

The application persistence contract remains:

~~~ts
interface StoredIdentity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
  readonly personId?: Id;
}

interface StoredParticipant {
  readonly id: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}
~~~

No new domain entity is introduced.

The dependency order remains:

~~~text
Person
  ↓
Identity
  ↓
Participant
  ↓
Context / Community references
~~~

Identity remains distinct from authentication and authorization. Participant remains distinct from authorization.

## 2. Production Physical Finding

Before this reconciliation, the production public.identities and public.participants tables were legacy-shaped and empty.

Verified production counts at the end of this operation:
- identities: 0
- participants: 0
- actions: 0
- payments: 0
- events: 0
- evidence: 0

No production data mapping or transformation is required.

The legacy physical relationship was incorrect for the canonical model:

~~~text
identities.participant_id → participants.id
~~~

The canonical direction is:

~~~text
participants.identity_id → identities.id
~~~

## 3. Canonical Physical Target

### Identity
~~~text
identities
  id         text PRIMARY KEY
  kind       text NOT NULL
  person_id  text NULL
~~~

kind is constrained to human | organization | service | system.

### Participant
~~~text
participants
  id            text PRIMARY KEY
  identity_id   text NOT NULL → identities.id
  community_id  text NULL     → communities.id
  context_id    text NULL     → contexts.id
~~~

The participant reference columns receive supporting indexes.

## 4. Controlled Migration

The narrow migration is migrations/identity-participant-physical-canonicalization-2026-10-02.sql.

It:
- removes the legacy identities.participant_id foreign key;
- removes legacy participant_id, status, and created_at columns from identities;
- adds canonical kind and optional person_id;
- removes legacy display_name, status, and created_at columns from participants;
- adds canonical identity_id, community_id, and context_id;
- establishes the canonical foreign keys;
- adds supporting participant-reference indexes;
- performs no data inserts, updates, deletes, table creation, table drops, provider work, or Event/Evidence changes.

The migration is transactional. Required canonical columns are added as NOT NULL without defaults, so applying it to a non-empty Identity or Participant table fails and rolls back rather than inventing mappings.

## 5. Disposable PostgreSQL / Neon Rehearsal

The migration was prepared and executed successfully on a disposable Neon branch:
- temporary branch: br-blue-glade-b5pdci8h
- parent production branch: br-frosty-poetry-b5tv56g1
- migration result: success

Post-rehearsal physical verification confirmed:
- Identity columns exactly match id, kind, person_id;
- Participant columns exactly match id, identity_id, community_id, context_id;
- legacy Identity → Participant foreign key is gone;
- canonical Participant → Identity foreign key exists;
- Participant → Community foreign key exists;
- Participant → Context foreign key exists;
- supporting participant-reference indexes exist.

Production was not changed by the rehearsal.

## 6. Application Producer Compatibility

The canonical producers remain createIdentity and createParticipant.

Both write through the repository boundary using the canonical DB-neutral representations.

Existing Identity + Participant tests cover human Identity with Person reference, non-human Identity, missing Person rejection, duplicate Identity rejection, Participant with existing Identity, Participant with Community, missing Identity rejection, missing Community rejection, duplicate Participant rejection, and separation from Account, Credential, Session, and Authorization.

The physical migration artifact also has a dedicated contract test.

## 7. CI Gate

GitHub Actions workflow #230 (36995175303) completed successfully on the reconciliation branch.

Verified jobs:
- beatcore — success
- postgres-runtime — success
- event-evidence-postgres-runtime — success

The beatcore job passed npm install, npm run typecheck, and npm test.

## 8. Production Safety Gate

Production remains on the pre-migration physical schema.

No production migration has been applied.
No Event/Evidence production migration has been applied.
No Payments change was made.

PR #24 was merged only to retain the migration contract test; the production database remains unchanged.

## 9. Final Gate

**🟡 PHYSICAL RECONCILIATION VERIFIED IN DISPOSABLE ENVIRONMENT — PRODUCTION APPROVAL PENDING.**

The Identity → Participant physical design is now reconciled and rehearsed.

The next operation is no longer architectural discovery. It is a controlled production schema application, which must be separately approved before execution.

No higher layer should be advanced on the assumption that production Identity/Participant physical persistence is already canonical.