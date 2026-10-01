-- Event/Evidence physical canonicalization
-- Migration ID: 023_event_evidence_physical_canonicalization_2026-10-02
-- Scope: canonical public.events/public.evidence; retire empty legacy event_evidence bridge.
-- Production execution is a separate explicit gate.

BEGIN;

DO $$
DECLARE
  v_event_rows bigint;
  v_evidence_rows bigint;
  v_link_rows bigint;
BEGIN
  IF to_regclass('public.zalagren_schema_migrations') IS NULL THEN
    RAISE EXCEPTION 'Migration ledger public.zalagren_schema_migrations is missing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.zalagren_schema_migrations WHERE id='023_event_evidence_physical_canonicalization_2026-10-02') THEN
    RAISE EXCEPTION 'Migration already registered';
  END IF;
  IF to_regclass('public.events') IS NULL OR to_regclass('public.evidence') IS NULL THEN
    RAISE EXCEPTION 'Expected legacy Event and Evidence tables are missing';
  END IF;
  SELECT count(*) INTO v_event_rows FROM public.events;
  SELECT count(*) INTO v_evidence_rows FROM public.evidence;
  IF v_event_rows <> 0 OR v_evidence_rows <> 0 THEN
    RAISE EXCEPTION 'Legacy Event/Evidence migration requires zero rows (events=%, evidence=%)', v_event_rows, v_evidence_rows;
  END IF;
  IF to_regclass('public.event_evidence') IS NOT NULL THEN
    SELECT count(*) INTO v_link_rows FROM public.event_evidence;
    IF v_link_rows <> 0 THEN
      RAISE EXCEPTION 'Legacy event_evidence contains % rows; no data transformation is authorized', v_link_rows;
    END IF;
  END IF;
  IF to_regclass('public.actions') IS NULL THEN RAISE EXCEPTION 'Action table is required before canonical Event physical schema'; END IF;
  IF to_regclass('public.identities') IS NULL THEN RAISE EXCEPTION 'Identity table is required before canonical Event physical schema'; END IF;
  IF to_regclass('public.contexts') IS NULL THEN RAISE EXCEPTION 'Context table is required before canonical Event physical schema'; END IF;
END $$;

DROP TABLE IF EXISTS public.event_evidence;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_source_check,
  DROP CONSTRAINT IF EXISTS events_status_check,
  DROP CONSTRAINT IF EXISTS events_context_id_not_null,
  DROP CONSTRAINT IF EXISTS events_participant_id_not_null,
  DROP CONSTRAINT IF EXISTS events_title_not_null,
  DROP CONSTRAINT IF EXISTS events_status_not_null,
  DROP CONSTRAINT IF EXISTS events_type_not_null,
  DROP CONSTRAINT IF EXISTS events_occurred_at_not_null;

DROP INDEX IF EXISTS public.idx_events_context_time;
DROP INDEX IF EXISTS public.idx_events_participant_time;

ALTER TABLE public.events
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS participant_id,
  DROP COLUMN IF EXISTS authorization_id,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS metadata;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS action_id text,
  ADD COLUMN IF NOT EXISTS state varchar(16),
  ADD COLUMN IF NOT EXISTS actor_id text,
  ADD COLUMN IF NOT EXISTS context_id text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz,
  ADD COLUMN IF NOT EXISTS correlation_id text,
  ADD COLUMN IF NOT EXISTS causation_id text,
  ADD COLUMN IF NOT EXISTS version bigint;

ALTER TABLE public.events
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN state SET NOT NULL,
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN occurred_at SET NOT NULL,
  ALTER COLUMN version SET NOT NULL,
  ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE public.events
  ADD CONSTRAINT events_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.actions(id) ON DELETE RESTRICT,
  ADD CONSTRAINT events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.identities(id) ON DELETE RESTRICT,
  ADD CONSTRAINT events_context_id_fkey FOREIGN KEY (context_id) REFERENCES public.contexts(id) ON DELETE RESTRICT,
  ADD CONSTRAINT events_type_not_blank CHECK (btrim(type) <> ''),
  ADD CONSTRAINT events_source_not_blank CHECK (btrim(source) <> ''),
  ADD CONSTRAINT events_state_check CHECK (state IN ('REQUESTED','AUTHORIZED','PROCESSING','COMPLETED','DENIED','REJECTED','FAILED','EXPIRED','CANCELLED','PARTIAL','DISPUTED','REVERSED','RECONCILED')),
  ADD CONSTRAINT events_version_check CHECK (version >= 1),
  ADD CONSTRAINT events_correlation_id_not_blank CHECK (correlation_id IS NULL OR btrim(correlation_id) <> ''),
  ADD CONSTRAINT events_causation_id_not_blank CHECK (causation_id IS NULL OR btrim(causation_id) <> '');

CREATE INDEX events_action_id_idx ON public.events(action_id) WHERE action_id IS NOT NULL;
CREATE INDEX events_context_time_idx ON public.events(context_id, occurred_at DESC) WHERE context_id IS NOT NULL;
CREATE INDEX events_correlation_id_idx ON public.events(correlation_id) WHERE correlation_id IS NOT NULL;

ALTER TABLE public.evidence
  DROP CONSTRAINT IF EXISTS evidence_status_check,
  DROP CONSTRAINT IF EXISTS evidence_statement_not_null,
  DROP CONSTRAINT IF EXISTS evidence_status_not_null;

ALTER TABLE public.evidence
  DROP COLUMN IF EXISTS statement,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS observed_at;

ALTER TABLE public.evidence
  ADD COLUMN IF NOT EXISTS event_id text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS verification varchar(16),
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_provider text,
  ADD COLUMN IF NOT EXISTS external_reference text;

ALTER TABLE public.evidence
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN verification SET NOT NULL,
  ALTER COLUMN recorded_at SET NOT NULL;

ALTER TABLE public.evidence
  ADD CONSTRAINT evidence_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE RESTRICT,
  ADD CONSTRAINT evidence_source_not_blank CHECK (btrim(source) <> ''),
  ADD CONSTRAINT evidence_verification_check CHECK (verification IN ('UNVERIFIED','VERIFIED','REJECTED')),
  ADD CONSTRAINT evidence_external_reference_pair_check CHECK ((external_provider IS NULL) = (external_reference IS NULL)),
  ADD CONSTRAINT evidence_external_provider_not_blank CHECK (external_provider IS NULL OR btrim(external_provider) <> ''),
  ADD CONSTRAINT evidence_external_reference_not_blank CHECK (external_reference IS NULL OR btrim(external_reference) <> '');

CREATE INDEX evidence_event_id_idx ON public.evidence(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX evidence_verification_idx ON public.evidence(verification);

INSERT INTO public.zalagren_schema_migrations(id)
VALUES ('023_event_evidence_physical_canonicalization_2026-10-02');

COMMIT;
