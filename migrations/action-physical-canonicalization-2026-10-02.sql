-- Action physical canonicalization migration
-- Migration ID: action-physical-canonicalization-2026-10-02
-- Scope: public.actions and its live physical dependencies only.
-- IMPORTANT: review/rehearse on a disposable Neon branch before production.
-- This file is source only. It has NOT been executed against production.

BEGIN;

DO $$
DECLARE
  v_rows bigint;
  v_migration_id text := 'action-physical-canonicalization-2026-10-02';
  v_missing integer;
  v_action_execution_fk integer;
BEGIN
  IF to_regclass('public.zalagren_schema_migrations') IS NULL THEN
    RAISE EXCEPTION 'Migration ledger public.zalagren_schema_migrations is missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.zalagren_schema_migrations
    WHERE id = v_migration_id
  ) THEN
    RAISE EXCEPTION 'Migration % is already registered', v_migration_id;
  END IF;

  IF to_regclass('public.actions') IS NULL THEN
    RAISE EXCEPTION 'Expected legacy table public.actions is missing';
  END IF;

  SELECT count(*) INTO v_rows FROM public.actions;
  IF v_rows <> 0 THEN
    RAISE EXCEPTION
      'Refusing canonicalization: public.actions contains % rows; no data transformation is authorized by this migration',
      v_rows;
  END IF;

  SELECT count(*) INTO v_missing
  FROM (
    VALUES
      ('id'),
      ('participant_id'),
      ('context_id'),
      ('capability_id'),
      ('action'),
      ('created_at')
  ) AS required(column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'actions'
      AND c.column_name = required.column_name
  );

  IF v_missing <> 0 THEN
    RAISE EXCEPTION 'Unexpected public.actions shape: required legacy column(s) are missing';
  END IF;

  SELECT count(*) INTO v_missing
  FROM (
    VALUES
      ('identities'),
      ('authorizations'),
      ('proposals'),
      ('contexts')
  ) AS required(table_name)
  WHERE to_regclass('public.' || required.table_name) IS NULL;

  IF v_missing <> 0 THEN
    RAISE EXCEPTION 'One or more canonical Action parent tables are missing';
  END IF;

  SELECT count(*) INTO v_action_execution_fk
  FROM pg_constraint con
  JOIN pg_class child ON child.oid = con.conrelid
  JOIN pg_class parent ON parent.oid = con.confrelid
  JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
  JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
  WHERE con.contype = 'f'
    AND child_ns.nspname = 'public'
    AND child.relname = 'action_executions'
    AND parent_ns.nspname = 'public'
    AND parent.relname = 'actions'
    AND pg_get_constraintdef(con.oid) ILIKE '%(action_id)% REFERENCES public.actions(id)%';

  IF v_action_execution_fk <> 1 THEN
    RAISE EXCEPTION
      'Expected exactly one public.action_executions.action_id -> public.actions.id FK; found %',
      v_action_execution_fk;
  END IF;
END
$$;

-- Preserve public.actions and its primary-key identity.
-- Legacy columns remain temporarily for compatibility, but cease to be canonical
-- and are made nullable so canonical application writes do not have to fabricate
-- legacy values.

ALTER TABLE public.actions
  DROP CONSTRAINT IF EXISTS actions_context_participant_fkey,
  DROP CONSTRAINT IF EXISTS actions_capability_action_fkey,
  DROP CONSTRAINT IF EXISTS actions_participant_id_fkey,
  DROP CONSTRAINT IF EXISTS actions_context_id_fkey,
  DROP CONSTRAINT IF EXISTS actions_capability_id_fkey;

ALTER TABLE public.actions
  ALTER COLUMN participant_id DROP NOT NULL,
  ALTER COLUMN context_id DROP NOT NULL,
  ALTER COLUMN capability_id DROP NOT NULL,
  ALTER COLUMN action DROP NOT NULL;

ALTER TABLE public.actions
  ADD COLUMN actor_id text,
  ADD COLUMN proposal_id text,
  ADD COLUMN authorization_id text,
  ADD COLUMN state varchar(16),
  ADD COLUMN operation text,
  ADD COLUMN correlation_id text,
  ADD COLUMN idempotency_key text,
  ADD COLUMN updated_at timestamptz,
  ADD COLUMN version bigint;

-- The live table is verified empty by the preflight, so canonical columns can
-- become immediately required without inventing a backfill mapping.
ALTER TABLE public.actions
  ALTER COLUMN actor_id SET NOT NULL,
  ALTER COLUMN authorization_id SET NOT NULL,
  ALTER COLUMN state SET NOT NULL,
  ALTER COLUMN operation SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN version SET NOT NULL;

ALTER TABLE public.actions
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE public.actions
  ADD CONSTRAINT actions_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.identities(id) ON DELETE RESTRICT,
  ADD CONSTRAINT actions_proposal_id_fkey
    FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE RESTRICT,
  ADD CONSTRAINT actions_authorization_id_fkey
    FOREIGN KEY (authorization_id) REFERENCES public.authorizations(id) ON DELETE RESTRICT,
  ADD CONSTRAINT actions_context_id_canonical_fkey
    FOREIGN KEY (context_id) REFERENCES public.contexts(id) ON DELETE RESTRICT,
  ADD CONSTRAINT actions_state_check
    CHECK (state IN (
      'REQUESTED',
      'AUTHORIZED',
      'PROCESSING',
      'COMPLETED',
      'DENIED',
      'REJECTED',
      'FAILED',
      'EXPIRED',
      'CANCELLED',
      'PARTIAL',
      'DISPUTED',
      'REVERSED',
      'RECONCILED'
    )),
  ADD CONSTRAINT actions_operation_not_blank
    CHECK (btrim(operation) <> ''),
  ADD CONSTRAINT actions_correlation_id_not_blank
    CHECK (correlation_id IS NULL OR btrim(correlation_id) <> ''),
  ADD CONSTRAINT actions_idempotency_key_not_blank
    CHECK (idempotency_key IS NULL OR btrim(idempotency_key) <> ''),
  ADD CONSTRAINT actions_updated_at_check
    CHECK (updated_at >= created_at),
  ADD CONSTRAINT actions_version_check
    CHECK (version >= 1);

-- Canonical Action idempotency is enforced at database level for supplied keys.
CREATE UNIQUE INDEX actions_idempotency_key_uq
  ON public.actions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Operational lookup indexes for canonical references.
CREATE INDEX actions_actor_id_idx
  ON public.actions (actor_id);

CREATE INDEX actions_authorization_id_idx
  ON public.actions (authorization_id);

CREATE INDEX actions_proposal_id_idx
  ON public.actions (proposal_id)
  WHERE proposal_id IS NOT NULL;

CREATE INDEX actions_context_id_idx
  ON public.actions (context_id)
  WHERE context_id IS NOT NULL;

-- Register applied state only after the canonicalization succeeds.
INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('action-physical-canonicalization-2026-10-02');

COMMIT;
