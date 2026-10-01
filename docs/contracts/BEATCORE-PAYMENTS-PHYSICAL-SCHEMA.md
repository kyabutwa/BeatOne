# BeatOne — Payments Physical PostgreSQL Schema Contract v1.0

**Status:** CANONICAL PHYSICAL SCHEMA CONTRACT — NOT YET IMPLEMENTED
**Date:** 2026-10-02
**Layer:** Payments Domain → Physical Persistence
**Authority:** Product Architecture → Technical Architecture → frozen BeatCore contracts → `BEATCORE-PAYMENTS.md` → Payments persistence contracts → current verified implementation
**Database:** PostgreSQL
**Production status:** NO PRODUCTION DATABASE CHANGE AUTHORIZED BY THIS CONTRACT

## 1. Purpose

This contract fixes the physical PostgreSQL representation of the canonical Payments persistence boundary before any migration or database adapter is implemented.

It resolves the remaining physical design questions identified by the Payments physical-persistence reconciliation:

- exact `payments` table shape;
- PostgreSQL types and constraints;
- canonical foreign keys;
- PaymentStatus representation;
- exact Payment idempotency scope;
- provider/reference atomicity;
- optimistic concurrency;
- indexes;
- delete/update behavior;
- transaction and compatibility boundaries.

This is a schema contract, not a migration.

It does **not** create or execute SQL, mutate Neon, select a payment provider, add webhooks, change BeatCore, or change production deployment.

## 2. Repository and migration-state reconciliation

The current BeatOne repository was inspected at the verified Action-Link baseline `37e6a3f2e15bab8d65965aa5b69e8aedc7ecf3c9`.

The repository currently contains no `migrations/` or `db/` directory and no committed `.sql` files discoverable on that baseline. The current package configuration contains only TypeScript typecheck/test scripts and no PostgreSQL/ORM dependency.

Therefore this contract does **not** pretend that an existing SQL schema or migration history has been verified from the repository.

Migration `023` remains explicitly outside production as previously required. Its physical contents and compatibility cannot be certified by this repository inspection because no corresponding migration file is present in the inspected tree.

A future Migration Safety Reconciliation must first establish the authoritative migration source/history before any migration is created or executed.

## 3. Ownership boundary

The physical representation is one dedicated table:

`payments`

Payments owns Payment-domain truth.

The following remain separate canonical records owned by BeatCore:

- `identities`;
- `participants`;
- `authorizations`;
- `actions`;
- `events`;
- `evidences`.

The schema must not:

- reuse `actions` as Payment truth;
- create `payment_actions`;
- create parallel Payment Event/Evidence tables;
- add `payment` to foundational BeatCore `EntityType`.

## 4. Canonical table contract

The canonical PostgreSQL table is:

```sql
payments
```

### 4.1 Columns

| Column | PostgreSQL type | Null | Default | Contract |
|---|---|---:|---|---|
| `id` | `text` | NO | none | opaque canonical Payment ID; primary key |
| `payer_participant_id` | `text` | YES | none | optional FK → `participants.id` |
| `payee_participant_id` | `text` | YES | none | optional FK → `participants.id` |
| `amount` | `numeric` | NO | none | exact monetary value; no floating point; no fixed scale yet |
| `currency` | `varchar(3)` | NO | none | uppercase ISO-style three-letter code validated by CHECK |
| `purpose` | `text` | NO | none | non-blank payment purpose/reference |
| `status` | `varchar(32)` | NO | none | Payments-owned status validated by CHECK |
| `actor_id` | `text` | NO | none | FK → `identities.id` |
| `authorization_id` | `text` | NO | none | FK → `authorizations.id` |
| `action_id` | `text` | YES | none | optional request-level FK → `actions.id`; required once consequential execution has an accepted Action |
| `idempotency_key` | `text` | NO | none | non-blank; globally unique within canonical `payments` records |
| `request_id` | `text` | YES | none | optional trace identifier |
| `correlation_id` | `text` | YES | none | optional trace identifier |
| `causation_id` | `text` | YES | none | optional trace identifier |
| `external_provider` | `text` | YES | none | optional provider identifier |
| `external_reference` | `text` | YES | none | optional provider reference |
| `created_at` | `timestamptz` | NO | none | canonical creation timestamp |
| `updated_at` | `timestamptz` | NO | none | last canonical update timestamp |
| `version` | `bigint` | NO | `1` | optimistic-concurrency version; integer ≥ 1 |

No other Payment column is canonical under v1.0.

## 5. Identifier rules

### 5.1 Payment identity

`payments.id` is the stable BeatOne Payment identity.

It is:

- opaque;
- stable;
- unique;
- independent of provider IDs;
- distinct from Action/Event/Evidence/Authorization/request IDs.

The database must not derive Payment identity from provider references.

### 5.2 Foreign-key identifiers

All canonical IDs are represented as `text` because the current BeatCore identifier contract uses opaque string IDs.

No database-specific UUID conversion is authorized merely for convenience.

## 6. Monetary contract

`amount` uses PostgreSQL `numeric`.

Floating-point types (`real`, `double precision`) are prohibited for canonical Payment amount.

No fixed precision/scale is imposed in v1.0 because the Payments contract has not yet defined currency-specific precision rules. A later version may narrow this through an explicit domain contract and migration.

The physical layer must preserve the exact canonical decimal representation and must not silently round, truncate, or convert it.

The application/domain layer remains responsible for canonical amount validation and normalization.

## 7. Currency contract

`currency` is `varchar(3)` with a database CHECK equivalent to:

```text
^[A-Z]{3}$
```

The value is uppercase and exactly three characters.

The database does not infer currency from:

- provider;
- participant;
- geography;
- account;
- locale.

Currency becomes immutable once the Payment is consequential. Any attempted consequential currency change must be rejected by the application/domain contract.

## 8. PaymentStatus contract

`status` is Payments-domain state and must not be mapped to generic BeatCore `LifecycleState`.

The database CHECK must allow exactly:

- `REQUESTED`
- `AUTHORIZED`
- `PROCESSING`
- `PENDING`
- `COMPLETED`
- `FAILED`
- `DENIED`
- `REJECTED`
- `CANCELLED`
- `PARTIAL`
- `UNKNOWN`
- `REVERSED`
- `RECONCILIATION_REQUIRED`
- `RECONCILED`

In particular:

- `UNKNOWN` is not `COMPLETED`;
- `PENDING` is not `COMPLETED`;
- `RECONCILIATION_REQUIRED` is not `COMPLETED`;
- provider acceptance is not completion.

The schema must not use a database enum whose lifecycle would make future controlled status evolution impossible without a versioned schema decision; a constrained text representation is the canonical v1.0 choice.

## 9. Authorization and Action linkage

The physical schema must enforce referential existence:

- `actor_id` → `identities.id`;
- `authorization_id` → `authorizations.id`;
- `action_id` → `actions.id` when supplied;
- `payer_participant_id` → `participants.id` when supplied;
- `payee_participant_id` → `participants.id` when supplied.

The semantic invariant remains:

```text
payment.actor_id === authorization.actor_id
```

When `action_id` is supplied:

```text
payment.actor_id === action.actor_id
payment.authorization_id === action.authorization_id
```

Foreign keys alone do not establish these cross-row equality invariants against the current canonical authorization/action contracts. The application/domain transaction must enforce them; the physical implementation must not create a competing authorization system.

### 9.1 Consequential Action requirement

`action_id` remains nullable at request-level creation.

Once a Payment is persisted as having entered a consequential execution path with an accepted canonical Action, `action_id` must be present.

The physical adapter must not fabricate an Action to satisfy the FK.

Payment status and Action lifecycle remain independent.

## 10. Idempotency contract

### 10.1 Exact v1.0 scope

The canonical Payment idempotency key is **globally unique within the `payments` table**.

There is no separate operation-type column in the v1.0 Payment schema, so a narrower composite uniqueness scope would be ambiguous.

Therefore:

```text
UNIQUE(payments.idempotency_key)
```

is the physical invariant.

Clients and application operations that need semantic namespaces must encode the namespace into the idempotency key under the application contract rather than relying on an unrepresented database scope.

### 10.2 Behavior

- Same key + same consequential request identity must resolve to the existing Payment rather than create a duplicate.
- Same key + materially different Payment parameters must fail as a conflict.
- Payment idempotency is separate from Action idempotency.
- Provider callback/webhook idempotency is a separate future integration concern and is not represented by this unique constraint.

## 11. External provider/reference atomicity

The schema must enforce:

```text
external_provider IS NULL ⇔ external_reference IS NULL
```

Therefore either:

- both are NULL; or
- both are non-NULL and non-blank.

Provider/reference values remain secondary evidence/traceability, never canonical Payment identity.

Provider acknowledgement must not directly imply `COMPLETED`.

## 12. Timestamp contract

Both `created_at` and `updated_at` are `timestamptz NOT NULL`.

The database must enforce:

```text
updated_at >= created_at
```

The application/domain contract remains responsible for meaningful lifecycle timestamp updates.

A timestamp is not the concurrency primitive.

## 13. Optimistic concurrency contract

The physical Payment row contains:

```text
version bigint NOT NULL DEFAULT 1 CHECK (version >= 1)
```

The version is monotonically incremented for every successful Payment replacement.

The authoritative stale-write mechanism is compare-and-swap on version:

```text
UPDATE payments
SET ...,
    version = version + 1,
    updated_at = ...
WHERE id = :payment_id
  AND version = :expected_version
RETURNING ...
```

If no row is returned, the operation must surface a conflict and must not overwrite the committed state.

A stale writer must therefore fail even when its timestamp is newer.

The physical implementation must never use `updated_at` alone as the concurrency boundary.

## 14. Insert/update/delete behavior

### Insert

- duplicate `id` → conflict;
- duplicate `idempotency_key` → conflict;
- invalid references → foreign-key failure;
- invalid status/currency/provider pair/version/timestamps → constraint or domain failure;
- initial `version` = 1.

### Update

- canonical `id` cannot change;
- `version` must be matched and incremented atomically;
- stale version → conflict;
- consequential currency changes → rejected;
- invalid PaymentStatus transitions → rejected by the Payments domain contract;
- actor/authorization/action relationships remain valid;
- idempotency key cannot be reassigned to a different Payment.

### Delete

Canonical Payment rows are **not cascade-deleted** by foundational-record deletion.

Foreign-key behavior is therefore `ON DELETE RESTRICT` for canonical references.

Payment history must not disappear because an Identity, Participant, Authorization, or Action is removed.

Physical deletion of a Payment is not a normal lifecycle transition. Payment cancellation, reversal, reconciliation, and other business outcomes remain explicit domain states/operations.

## 15. Index contract

Required physical indexes beyond the primary key:

1. unique index on `idempotency_key`;
2. index on `action_id` for Payment ↔ Action traceability;
3. index on `authorization_id`;
4. index on `actor_id`;
5. index on `payer_participant_id`;
6. index on `payee_participant_id`;
7. index on `correlation_id` where reconciliation/trace queries require it;
8. index on `status` for operational/reconciliation queries.

The unique primary-key index on `id` is supplied by PostgreSQL and is not duplicated.

No speculative provider-specific indexes are canonical in v1.0.

## 16. Transaction contract

A consequential local Payment transaction remains:

**validate → authorize → create/update Payment + Action linkage → record canonical Event/Evidence where applicable → commit**

All local Payment and canonical-record writes belonging to one atomic operation must commit together.

External provider calls remain outside the local PostgreSQL transaction.

If external outcome is unresolved, the local transaction must persist `UNKNOWN` or `RECONCILIATION_REQUIRED` as applicable.

The database must never be treated as proof that an external provider completed an operation merely because a local row was committed.

## 17. Event and Evidence boundary

The `payments` table does not contain `event_id` or `evidence_id` as replacements for the canonical Event/Evidence model.

Payment, Action, Event, and Evidence remain distinct records.

The existing canonical Event references Action.

The existing canonical Evidence can substantiate recognized external/payment occurrences.

No duplicate payment event/evidence tables are introduced.

## 18. Referential deletion and lifecycle integrity

No foreign key uses `CASCADE` deletion in v1.0.

The purpose is to prevent accidental destruction of consequential payment history.

If a future archival/deletion policy requires a different behavior, it must be introduced through an explicit versioned data-retention contract and migration review.

## 19. Compatibility boundary

This contract is compatible with the current verified DB-neutral Payment representation except for one explicitly physical-only concurrency field:

- `version` is new physical persistence metadata required to provide safe PostgreSQL optimistic concurrency.

The current DB-neutral `StoredPayment` does not yet contain `version`. That is intentionally left for the next implementation stage and is not patched as part of this schema-only contract.

The canonical `actionId` relationship is already present in the verified Payments application/persistence contract and maps directly to `action_id`.

No foundational BeatCore type change is required.

## 20. Migration boundary

This contract authorizes **no migration**.

Before any migration is created, the next controlled stage is:

**Migration Safety Reconciliation**

That stage must establish:

1. authoritative current database schema/source;
2. authoritative migration history and numbering;
3. exact target database state;
4. whether any prior `023` artifact exists outside the inspected repository;
5. forward migration behavior;
6. rollback/recovery behavior;
7. data/backfill requirements;
8. deployment compatibility;
9. non-production verification;
10. production approval requirements.

No migration number is considered safe merely because it is available.

## 21. Required physical verification

Before the physical persistence implementation can be considered verified, deterministic PostgreSQL tests must prove:

1. exact `payments` columns/types/nullability;
2. opaque text Payment primary key;
3. exact numeric amount without floating-point conversion;
4. uppercase three-character currency constraint;
5. all PaymentStatus values remain representable;
6. payer/payee foreign keys;
7. actor foreign key;
8. authorization foreign key;
9. action foreign key;
10. actor/authorization semantic equality;
11. action actor/authorization semantic equality;
12. globally unique Payment idempotency;
13. conflicting idempotency reuse rejection;
14. provider/reference pair atomicity;
15. `updated_at >= created_at`;
16. version starts at 1;
17. successful update increments version exactly once;
18. stale version update affects zero rows and surfaces conflict;
19. stale writer cannot erase a newer state;
20. request-level Payment can exist without `action_id`;
21. consequential execution persistence requires `action_id`;
22. no duplicate Action/Event/Evidence record is introduced;
23. UNKNOWN and RECONCILIATION_REQUIRED remain distinct;
24. transaction rollback leaves no partial local Payment write;
25. transaction commit publishes the complete local operation;
26. restrictive foreign-key deletion preserves Payment history;
27. existing BeatCore and Payments tests remain green.

## 22. Explicit non-goals

This v1.0 contract does not implement:

- SQL migration files;
- migration execution;
- Neon mutation;
- production database access;
- payment providers;
- M-PESA/bank/card/wallet adapters;
- webhooks;
- API endpoints;
- UI;
- hardware;
- GENESIS authority or semantics;
- Economy accounting;
- Commerce fulfillment;
- changes to foundational BeatCore `EntityType`;
- production deployment.

## 23. Contract gate

### 🟢 VERIFIED — PAYMENTS PHYSICAL POSTGRESQL SCHEMA CONTRACT RECONCILED

The physical PostgreSQL boundary is now fixed at the contract level:

- one dedicated `payments` table;
- opaque text Payment identity;
- exact PostgreSQL `numeric` amount;
- constrained uppercase currency;
- explicit Payments-domain status set;
- canonical foreign keys;
- optional `action_id` with consequential execution requirement;
- globally unique Payment idempotency key;
- atomic provider/reference pair;
- explicit optimistic-concurrency `version`;
- restrictive deletion;
- deterministic operational indexes;
- local transaction boundary preserved;
- no provider semantics promoted into canonical Payment truth.

**Next exact stage: Migration Safety Reconciliation.**

No SQL migration, Neon mutation, provider integration, or production change is authorized by this contract.
