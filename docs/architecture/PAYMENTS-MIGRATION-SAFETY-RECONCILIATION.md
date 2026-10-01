# Payments Migration Safety Reconciliation

**Status:** RECONCILIATION COMPLETE — MIGRATION EXECUTION GATE CLOSED
**Date:** 2026-10-02
**Layer:** Payments Physical Persistence → Migration Safety
**Database inspected:** Neon project `muddy-king-32123546` / `Zalagren`
**Branch inspected:** `production` (`br-frosty-poetry-b5tv56g1`)
**Database:** `neondb`
**Production mutation:** NONE
**Migration execution:** NONE

## 1. Purpose

This reconciliation establishes the actual database and migration state before any migration is authored or executed for the approved Payments physical PostgreSQL schema.

It reconciles:

- repository migration artifacts;
- live Neon migration ledger;
- live PostgreSQL schema;
- existing Payments physical tables;
- canonical Action/Event/Evidence dependencies;
- migration numbering;
- existing data;
- safe target-state requirements.

The result is intentionally a **closed migration-execution gate** because the live database and repository are not currently represented by one authoritative migration source.

## 2. Repository state

The verified BeatOne main baseline is:

`75db042a57e216539971ccca1c5502ef098f2f54`

Repository inspection found:

- no committed `migrations/` directory;
- no committed `db/` directory;
- no committed `.sql` migration artifacts;
- no repository references to `payment_intents`;
- no repository references to `payment_events`;
- no repository reference to `zalagren_schema_migrations`;
- no repository artifact defining migrations 016–023.

Therefore the Git repository is **not currently the authoritative source of the live database migration history**.

This is a material migration-safety finding, not a reason to invent missing migration files.

## 3. Live Neon state

The connected Neon project was inspected read-only.

Project:

- name: `Zalagren`;
- project ID: `muddy-king-32123546`;
- PostgreSQL version: 18.6;
- default/primary branch: `production`;
- branch ID: `br-frosty-poetry-b5tv56g1`;
- database: `neondb`.

No schema mutation was performed.

## 4. Authoritative live migration ledger

The live database contains:

`public.zalagren_schema_migrations`

with:

| Migration ID | Applied at |
|---|---|
| `durable-runtime-auth-2026-09-28` | 2026-09-28T17:06:20.436Z |
| `next-2-backbone-2026-09-28` | 2026-09-28T17:06:20.436Z |
| `016_production_persistence_reconciliation` | 2026-09-30T12:44:30.434Z |
| `017_authentication_persistence_hardening` | 2026-09-30T12:57:14.428Z |
| `018_relationship_validity_hardening` | 2026-09-30T13:04:48.458Z |
| `019_context_persistence_reconciliation` | 2026-09-30T13:23:29.383Z |
| `020_capability_contract_reconciliation` | 2026-09-30T15:59:04.808Z |
| `021_authorization_integrity_hardening` | 2026-09-30T16:14:01.303Z |
| `022_cross_entity_lifecycle_integrity` | 2026-09-30T17:25:14.621Z |

There is **no applied `023` record** in the inspected production migration ledger.

This is the first important correction to the previous repository-only picture: migration history does exist in the live database even though it is not represented by committed SQL in the repository.

## 5. Existing Payments physical state

The live database contains two existing Payments-related tables:

- `public.payment_intents`
- `public.payment_events`

Both currently contain zero rows.

### Existing `payment_intents`

The live table is materially different from the approved canonical Payments schema.

It currently contains fields including:

- `id`;
- `participant_id`;
- `context_id`;
- `amount_minor integer`;
- `currency character`;
- `rail`;
- `status`;
- nullable `idempotency_key`;
- `provider_reference`;
- `checkout_request_id`;
- `merchant_request_id`;
- `description`;
- timestamps.

It does not represent the approved canonical Payment shape.

Notably, it does not provide:

- exact canonical `amount numeric`;
- `payer_participant_id`;
- `payee_participant_id`;
- `purpose` under the canonical contract;
- `actor_id`;
- `authorization_id`;
- `action_id`;
- `request_id`;
- `correlation_id`;
- `causation_id`;
- atomic `external_provider` + `external_reference`;
- `version`.

### Existing `payment_events`

The live table contains provider-oriented event data including:

- `payment_id`;
- provider/event type;
- provider reference;
- checkout/merchant request IDs;
- result information;
- timestamp;
- JSON payload.

Its `payment_id` references `payment_intents(id)`.

This is not the canonical BeatCore Event/Evidence representation approved for Payments.

## 6. Canonical dependency state

The live database already contains canonical foundation tables required by the approved Payments schema, including:

- `participants`;
- `identities`;
- `authorizations`;
- `actions`;
- `events`;
- `evidence`.

The inspected schemas use opaque `text` identifiers, which is compatible with the approved Payments physical identifier strategy.

The existing `actions` table, however, does **not** contain an `authorization_id` column in the live schema inspected here. Therefore the application-level Action contract and the live physical Action schema are not identical to the simplified relationship assumed by the Payments physical schema contract.

This means the future Payment → Action referential/semantic implementation must reconcile the actual Action physical contract before a Payments migration is authored.

No shortcut or fabricated foreign-key relationship is authorized.

## 7. Critical migration-safety finding

The approved Payments physical schema is **not a simple additive migration onto the current live Payments tables**.

The target is:

`public.payments`

while the current live Payments representation is:

`public.payment_intents` + `public.payment_events`

Therefore a future migration must explicitly decide the fate and ownership of these existing tables.

Because both existing Payments tables currently contain **zero rows**, there is no current Payments business data requiring a data backfill according to the inspected live database.

However, zero rows do **not** automatically authorize destructive removal.

The migration must not silently:

- drop `payment_intents`;
- drop `payment_events`;
- rename either table;
- reinterpret provider-event data;
- merge provider events into canonical Event/Evidence;
- manufacture Payment records.

Those actions require an explicit migration/data-retention decision.

## 8. Migration 023 status

Migration `023` is not present in the live migration ledger.

Migration `023` is also not present as a committed SQL artifact in the inspected repository.

Therefore:

**023 is not currently established as an authoritative applied migration.**

The correct state is:

**🟡 SUPPORTED — 023 is absent from the inspected production ledger and repository tree.**

It must not be assumed to exist, recreated from memory, or overwritten.

If an external deployment system, historical branch, local artifact, or prior environment contains a `023` definition, that artifact must be recovered and reconciled before any new migration numbering is selected.

## 9. Migration numbering decision

No migration number is selected by this reconciliation.

A future migration identifier must be chosen only after:

1. authoritative migration source is established;
2. all applied IDs are reproducible from source;
3. the target schema is mapped against actual live schema;
4. any historical 023 artifact is resolved;
5. legacy Payments table disposition is explicitly decided;
6. dependency ordering is fixed.

The database ledger alone is not sufficient to recreate migration source.

## 10. Safe target state

The target physical state remains the previously verified Payments physical schema:

- dedicated `payments` table;
- opaque text Payment ID;
- `numeric` exact amount;
- constrained uppercase three-character currency;
- Payments-owned status;
- Participant FKs;
- Identity actor FK;
- Authorization FK;
- optional Action FK;
- globally unique Payment idempotency key;
- provider/reference atomicity;
- `timestamptz` timestamps;
- monotonic `version bigint`;
- optimistic compare-and-swap update semantics;
- restrictive deletion;
- operational indexes;
- no duplicate Payment Event/Evidence tables.

The migration must implement this target without weakening the canonical domain contract to accommodate legacy physical tables.

## 11. Required migration design before authoring SQL

The next migration-design pass must resolve these exact questions:

### A. Migration source authority
Where do migrations 016–022 and the two earlier named migrations live outside the current repository, and how are they to be made reproducible?

### B. Legacy Payments disposition
Because `payment_intents` and `payment_events` are empty, determine whether they are:

- retained temporarily;
- formally deprecated;
- renamed;
- removed in a separately approved cleanup migration;
- or preserved permanently for a distinct legacy/integration boundary.

No option is assumed here.

### C. Action physical compatibility
Reconcile the actual live `actions` schema with the canonical Action contract before defining the `payments.action_id` foreign key and consequential execution transaction.

### D. Dependency ordering
The Payments migration depends on existing:

`participants → identities/authorizations/actions → payments`

relationships.

The exact FK creation order must be encoded in the migration plan.

### E. Transaction and rollback
The migration must be transactionally safe where PostgreSQL permits, and must define recovery for any non-transactional operational step.

### F. Empty-state proof
The current zero-row state of `payment_intents` and `payment_events` must be rechecked immediately before any destructive legacy-table operation.

### G. Production approval
No production migration may be applied merely because the SQL passes in a temporary branch.

## 12. Verification plan

Before production migration approval, the future migration must be tested on a disposable Neon branch cloned from the current production branch.

Verification must prove:

1. migration starts from the current real schema;
2. migration ledger state is preserved;
3. existing foundation tables remain valid;
4. `payments` matches the canonical physical schema;
5. all required constraints and indexes exist;
6. Payment idempotency is database-enforced;
7. provider/reference atomicity is enforced;
8. Action linkage is valid;
9. optimistic concurrency works;
10. UNKNOWN/reconciliation states remain representable;
11. legacy Payments tables are handled exactly as explicitly approved;
12. no data is lost;
13. rollback/recovery behavior is understood;
14. application tests remain green;
15. migration bookkeeping is deterministic;
16. production branch remains untouched until explicit approval.

## 13. Explicit safety gates

### 🟢 Verified

- Live Neon project and production branch were inspected read-only.
- PostgreSQL version and database were confirmed.
- Live migration ledger was inspected.
- Applied migration IDs 016–022 were confirmed.
- No applied 023 record was found.
- Existing Payments tables were inspected.
- Existing Payments row counts are zero.
- Foundation dependency tables exist.
- No production mutation was performed.

### 🔵 Proposed

- canonical `payments` target;
- migration implementation;
- legacy-table disposition;
- migration numbering;
- temporary-branch verification.

### 🔴 Blocked

Production migration is blocked until the authoritative migration source/history and legacy Payments disposition are resolved.

## 14. No-mutation guarantee

This reconciliation performed no:

- `CREATE TABLE`;
- `ALTER TABLE`;
- `DROP TABLE`;
- `RENAME`;
- `INSERT`;
- `UPDATE`;
- `DELETE`;
- migration application;
- production schema mutation.

All Neon database inspection performed for this reconciliation was read-only.

## 15. Gate

### 🟡 SUPPORTED — MIGRATION SAFETY RECONCILIATION COMPLETE, EXECUTION GATE CLOSED

The important result is not a premature green light.

The real database has now been reconciled against the approved Payments schema and a concrete migration blocker has been identified:

**the live database has an existing legacy Payments physical model and a live migration ledger that is not currently reproducible from the BeatOne repository.**

Therefore the next exact action is **not** to write migration SQL.

The next exact action is:

**AUTHORITATIVE MIGRATION SOURCE + LEGACY PAYMENTS DISPOSITION RECONCILIATION**

After that is proven, and only then:

**Migration Design → Temporary-Branch Verification → Migration Review → Explicit Production Approval.**
