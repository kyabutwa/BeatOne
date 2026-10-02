-- Person physical canonicalization migration
-- Migration ID: person-physical-canonicalization-2026-10-02
-- Scope: public.persons and identities.person_id -> persons.id only.
-- Production execution is a separate explicit gate.

BEGIN;

DO $$
DECLARE
  v_identity_rows bigint;
  v_migration_id text := 'person-physical-canonicalization-2026-10-02';
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

  IF to_regclass('public.persons') IS NOT NULL THEN
    RAISE EXCEPTION 'Expected public.persons to be absent; refusing to alter an existing table';
  END IF;

  IF to_regclass('public.identities') IS NULL THEN
    RAISE EXCEPTION 'Expected public.identities table is missing';
  END IF;

  SELECT count(*) INTO v_identity_rows FROM public.identities;
  IF v_identity_rows <> 0 THEN
    RAISE EXCEPTION
      'Refusing Person canonicalization: public.identities contains % rows; no data transformation is authorized by this migration',
      v_identity_rows;
  END IF;
END
$$;

CREATE TABLE public.persons (
  id text NOT NULL,
  CONSTRAINT persons_pkey PRIMARY KEY (id)
);

ALTER TABLE public.identities
  ADD CONSTRAINT identities_person_id_fkey
  FOREIGN KEY (person_id) REFERENCES public.persons(id);

-- Register applied state only after the schema change succeeds.
INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('person-physical-canonicalization-2026-10-02');

COMMIT;