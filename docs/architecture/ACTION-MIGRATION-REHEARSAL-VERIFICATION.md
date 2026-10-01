# Action Migration Disposable Neon Rehearsal Verification

Status: 🟢 VERIFIED — PHYSICAL MIGRATION MECHANICS VERIFIED FOR CURRENT ZERO-ROW PRODUCTION STATE

Date: 2026-10-02

## Rehearsal target

Production parent:

- Neon project: Zalagren
- Project ID: muddy-king-32123546
- Production branch: br-frosty-poetry-b5tv56g1
- Database: neondb
- PostgreSQL: 18.6

Disposable branches were created from the production branch and deleted after verification.

## Source under rehearsal

Migration:

`migrations/action-physical-canonicalization-2026-10-02.sql`

Migration ID:

`action-physical-canonicalization-2026-10-02`

A rehearsal exposed and corrected one source guard defect: PostgreSQL renders the existing dependency as `FOREIGN KEY (action_id) REFERENCES actions(id)`, not with an explicit `public.` qualifier. The guard was corrected and merged before the successful rehearsal.

## Production-state preconditions observed on disposable clone

- `public.actions`: 0 rows
- `public.action_executions`: 0 rows
- migration ID absent from `public.zalagren_schema_migrations`
- exactly one `action_executions.action_id → actions.id` FK present

No production SQL was executed.

## Successful migration rehearsal

The migration changes completed successfully on disposable branch:

- preserved `public.actions` and its primary key;
- retained legacy columns temporarily but made them nullable;
- established canonical `actor_id`, `proposal_id`, `authorization_id`, `state`, `operation`, `correlation_id`, `idempotency_key`, `updated_at`, and `version`;
- established canonical lifecycle constraint;
- established canonical parent FKs;
- established non-blank/timestamp/version constraints;
- established partial unique Action idempotency index;
- established canonical lookup indexes;
- preserved the `action_executions.action_id → actions.id` FK;
- registered the migration ID only after the schema transaction succeeded.

Post-rehearsal inspection confirmed:

- legacy-only constraints removed;
- Action idempotency index present;
- Action migration ledger entry present;
- action-executions dependency still present.

## Failure and rollback rehearsal

A second disposable branch executed the migration changes inside one transaction with a deliberate final failure (`division by zero`).

After failure:

- `actor_id` column did not exist;
- Action idempotency index did not exist;
- migration ledger entry did not exist;
- `action_executions.action_id → actions.id` remained intact.

Therefore the migration transaction rolled back atomically.

## Idempotency/rerun guard

On the successfully migrated disposable branch, rerunning the migration preflight rejected the already-registered migration ID before any further mutation.

## Canonical Action behavior coverage

Database-level canonical constraints and referential boundaries were verified.

A fully valid canonical Action row was not fabricated for the rehearsal because the cloned production state currently has zero `authorizations`, `contexts`, and `capabilities`. Creating an artificial parent graph would test invented domain state rather than the migration itself.

Therefore:

- physical migration mechanics: 🟢 VERIFIED;
- physical dependency continuity: 🟢 VERIFIED;
- transaction rollback/failure behavior: 🟢 VERIFIED;
- rerun protection: 🟢 VERIFIED;
- full valid runtime Action transaction against populated parent entities: 🟡 NOT EXERCISED.

## Production gate

Production migration remains closed.

No production schema, data, migration ledger, Payments tables, or deployment state was changed by this rehearsal.

Next controlled stage:

**🔵 ACTION RUNTIME PHYSICAL VERIFICATION AGAINST A CONTROLLED NON-PRODUCTION PARENT GRAPH → THEN PAYMENTS MIGRATION DESIGN**

The next stage must create only the minimum disposable parent graph required to exercise a valid canonical Action and its authorization relationship, then verify Action idempotency/concurrency semantics before Payments migration design.
