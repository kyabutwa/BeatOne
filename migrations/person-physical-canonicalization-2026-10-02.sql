-- Person physical canonicalization migration
-- Migration ID: person-physical-canonicalization-2026-10-02
-- Scope: public.persons and identities.person_id -> persons.id only.
-- Production execution is a separate explicit gate.

BEGIN;

-- Guard the exact zero-data/absence preconditions without procedural SQL.
SELECT 1 / CASE
  WHEN to_regclass('public.zalagren_schema_migrations') IS NOT NULL
   AND to_regclass('public.identities') IS NOT NULL
   AND to_regclass('public.persons') IS NULL
   AND (SELECT count(*) FROM public.identities) = 0
   AND NOT EXISTS (
     SELECT 1 FROM public.zalagren_schema_migrations
     WHERE id = 'person-physical-canonicalization-2026-10-02'
   )
  THEN 1
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