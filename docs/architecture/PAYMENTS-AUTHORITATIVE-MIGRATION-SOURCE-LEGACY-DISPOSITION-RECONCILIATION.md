# Authoritative Migration Source + Legacy Payments Disposition Reconciliation

**Status:** RECONCILIATION COMPLETE — MIGRATION DESIGN GATE REMAINS CLOSED  
**Date:** 2026-10-02  
**Production database mutation:** NONE  
**Migration SQL:** NONE CREATED OR EXECUTED

## 1. Scope

This stage reconciles the live migration ledger, repository migration-source availability, live Action physical schema, and legacy Payments tables before any migration SQL is authored.

## 2. Migration-source authority

The live production database is Neon project `Zalagren` (`muddy-king-32123546`), branch `br-frosty-poetry-b5tv56g1`, database `neondb`.

The live table `public.zalagren_schema_migrations` is authoritative for **applied-state history**. It contains:

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

The repository and accessible branches were searched for these migration IDs, migration SQL, a migration source tree, and migration 023. No authoritative committed SQL source was found, and no accessible 023 artifact was found.

**Authority distinction:** the live ledger proves which IDs were recorded as applied; it does not contain the historical SQL required to reproduce them.

The historical SQL must therefore **not** be reconstructed from the final schema. Different SQL histories can produce similar schemas while differing in ordering, guards, data transformations, and recovery behavior.

### 023 status

There is no applied 023 row and no accessible committed 023 source.

**023 remains unassigned. It must not be recreated from memory or assumed to exist.**

The recovered record for 016–022 is a migration manifest (IDs + applied timestamps + observed live state), not fabricated SQL source.

## 3. Migration-source governance decision

Future production migrations require a committed, reviewable migration source tree with deterministic identifiers that correspond exactly to the migration ledger when applied.

Historical 016–022 remain legacy applied history until their original source is recovered from an authoritative external artifact. They are not to be invented merely to make the repository appear reproducible.

## 4. Live Action physical reconciliation

The canonical Action contract requires `id`, `actorId`, optional `proposalId`, required `authorizationId`, `state`, `operation`, optional `contextId`, optional `correlationId`, and optional `idempotencyKey`.

The canonical persistence contract requires `actions.authorization_id` referencing `authorizations.id`.

The live `public.actions` table instead contains only:

- `id text not null`;
- `participant_id text not null`;
- `context_id text not null`;
- `capability_id text not null`;
- `action text not null`;
- `created_at timestamptz not null default now()`.

It lacks `authorization_id` and also lacks canonical `actor_id`, `proposal_id`, `state`, `operation`, `correlation_id`, and `idempotency_key`.

**Result:** this is a physical Action contract mismatch, not a Payments defect.

The Payments `action_id` foreign key and consequential transaction semantics cannot be finalized safely until a dedicated Action physical persistence reconciliation establishes the canonical Action physical state.

No Action mutation is performed here. No parallel Action representation may be created to bypass this dependency.

## 5. Legacy Payments state

The live database contains:

- `public.payment_intents`;
- `public.payment_events`.

Both were inspected and contain **zero rows**.

`payment_intents` is an older intent representation using fields such as `participant_id`, `context_id`, `amount_minor`, `currency`, `rail`, `status`, idempotency/provider/checkout references, description, and timestamps.

`payment_events` is an older provider-event representation. Its `payment_id` references `payment_intents(id)`. It is not the canonical BeatCore Event/Evidence representation.

## 6. Legacy Payments disposition decision

### RETAIN + DEPRECATE

For the initial canonical Payments migration:

1. `payment_intents` and `payment_events` remain physically present.
2. They are explicitly legacy/deprecated, not canonical Payments truth.
3. Canonical application writes move to `payments`; the legacy tables are not a second Payment source.
4. They are not dropped, renamed, or transformed by the initial Payments creation migration.
5. A later cleanup may be considered only after consumer/dependency verification and separate explicit approval.

The tables being empty means no current Payment data backfill is required. It does **not** prove that no runtime, deployment artifact, callback, or operational process references them, so destructive cleanup is intentionally separated.

The legacy `payment_events` table must not be automatically merged into canonical `events` or `evidence`.

## 7. Exact remaining gates

Before Payments Migration Design:

1. Recover original migration source for 016–022 from any authoritative external artifact, if one exists; otherwise retain the historical manifest without inventing SQL.
2. Perform a dedicated Action physical persistence reconciliation.
3. Verify current application/runtime consumers of the legacy Payments tables.
4. Establish the committed migration source/registration mechanism for future migrations.
5. Only then select a new migration identifier; 023 remains unassigned.

## 8. Verification state

### 🟢 VERIFIED

- Live migration ledger inspected read-only.
- Applied migration IDs through 022 confirmed.
- No applied 023.
- Repository and accessible branches searched for migration source and 023.
- No authoritative committed migration SQL source found.
- Live Action schema inspected.
- Canonical Action contracts inspected.
- Action physical mismatch confirmed.
- `payment_intents` and `payment_events` confirmed empty.
- No database mutation performed.
- No migration SQL created or executed.

### 🟡 ESTABLISHED

- Live ledger is authoritative for applied IDs, not historical SQL source.
- Missing historical SQL must not be fabricated.
- 023 is unassigned.
- Legacy Payments tables are retained + deprecated for the initial canonical Payments migration.
- Destructive legacy cleanup is deferred to a separate approved migration.
- Action physical reconciliation is a prerequisite dependency.

### 🔴 NOT AUTHORIZED

- Creating or executing migration SQL.
- Selecting migration 023.
- Altering `actions`.
- Creating `payments` in production.
- Dropping or renaming legacy Payments tables.
- Production data writes.

## 9. Gate

### 🟡 SUPPORTED — AUTHORITATIVE MIGRATION SOURCE + LEGACY PAYMENTS DISPOSITION RECONCILIATION COMPLETE

The requested gate has been executed without touching the production schema.

The migration path is now explicit:

**Live migration ledger → applied history established → source recovery attempted without fabrication → Action physical mismatch confirmed → legacy Payments disposition fixed as retain + deprecate → Payments migration design remains gated on Action physical reconciliation and migration-source governance.**

**No migration SQL was created or executed.**
