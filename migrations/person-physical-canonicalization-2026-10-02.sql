-- Person physical canonicalization migration
-- Migration ID: person-physical-canonicalization-2026-10-02
-- Scope: public.persons and identities.person_id -> persons.id only.
-- Production execution is a separate explicit gate.

BEGIN;

-- Guard the exact zero-data/absence preconditions without procedural SQL.
SELECT CASE
  WHEN to_regclass('public.zalagren_schema_migrations') IS NULL THEN
    CAST('migration ledger missing' AS integer)
  WHEN to_regclass('public.identities') IS NULL THEN
    CAST('identities table missing' AS integer)
  WHEN to_regclass('public.persons') IS NOT NULL THEN
    CAST('persons table already exists' AS integer)
  WHEN (SELECT count(*) FROM public.identities) <> 0 THEN
    CAST('identities is not empty' AS integer)
  WHEN EXISTS (
    SELECT 1 FROM public.zalagren_schema_migrations
    WHERE id = 'person-physical-canonicalization-2026-10-02'
  ) THEN
    CAST('migration already registered' AS integer)
  ELSE 0
END;

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