-- Event / Evidence physical canonicalization
-- Migration ID: event-evidence-physical-canonicalization-2026-10-02
-- Scope: public.events, public.evidence -> public.evidences, and removal of public.event_evidence.
-- Preconditions: all affected Event/Evidence tables are empty and canonical parent tables already exist.
-- Provider auth tables remain separate infrastructure.
-- Production execution is a separate explicit gate.

BEGIN;

SELECT 1 / CASE
  WHEN to_regclass('public.zalagren_schema_migrations') IS NOT NULL
   AND to_regclass('public.events') IS NOT NULL
   AND to_regclass('public.evidence') IS NOT NULL
   AND to_regclass('public.evidences') IS NULL
   AND to_regclass('public.event_evidence') IS NOT NULL
   AND to_regclass('public.action_outcome_trace') IS NOT NULL
   AND (SELECT count(*) FROM public.actions) = 0
   AND (SELECT count(*) FROM public.action_executions) = 0
   AND (SELECT count(*) FROM public.events) = 0
   AND (SELECT count(*) FROM public.evidence) = 0
   AND (SELECT count(*) FROM public.event_evidence) = 0
   AND (SELECT count(*) FROM public.action_outcome_trace) = 0
   AND (SELECT count(*) FROM public.auth_methods) = 0
   AND (SELECT count(*) FROM public.auth_sessions) = 0
   AND NOT EXISTS (
     SELECT 1 FROM public.zalagren_schema_migrations
     WHERE id = 'event-evidence-physical-canonicalization-2026-10-02'
   )
  THEN 1
  ELSE 0
END;

DROP TABLE public.event_evidence;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_context_id_not_null,
  DROP CONSTRAINT IF EXISTS events_occurred_at_not_null,
  DROP CONSTRAINT IF EXISTS events_participant_id_not_null,
  DROP CONSTRAINT IF EXISTS events_source_check,
  DROP CONSTRAINT IF EXISTS events_status_check,
  DROP CONSTRAINT IF EXISTS events_status_not_null,
  DROP CONSTRAINT IF EXISTS events_title_not_null,
  DROP CONSTRAINT IF EXISTS events_type_not_null;

DROP INDEX IF EXISTS idx_events_participant_time;

ALTER TABLE public.events
  DROP COLUMN title,
  DROP COLUMN participant_id,
  DROP COLUMN authorization_id,
  DROP COLUMN status,
  DROP COLUMN metadata;

ALTER TABLE public.events
  ADD COLUMN action_id text,
  ADD COLUMN state text NOT NULL,
  ADD COLUMN correlation_id text,
  ADD COLUMN causation_id text,
  ADD COLUMN version bigint NOT NULL DEFAULT 1;

ALTER TABLE public.events
  ALTER COLUMN context_id DROP NOT NULL,
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE public.events
  ADD CONSTRAINT events_action_id_fkey
    FOREIGN KEY (action_id) REFERENCES public.actions(id),
  ADD CONSTRAINT events_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.identities(id),
  ADD CONSTRAINT events_context_id_fkey
    FOREIGN KEY (context_id) REFERENCES public.contexts(id),
  ADD CONSTRAINT events_type_not_blank
    CHECK (btrim(type) <> ''),
  ADD CONSTRAINT events_source_not_blank
    CHECK (btrim(source) <> ''),
  ADD CONSTRAINT events_state_check
    CHECK (state IN (
      'REQUESTED','AUTHORIZED','PROCESSING','COMPLETED','DENIED',
      'REJECTED','FAILED','EXPIRED','CANCELLED','PARTIAL',
      'DISPUTED','REVERSED','RECONCILED'
    )),
  ADD CONSTRAINT events_version_check
    CHECK (version >= 1);

CREATE INDEX idx_events_action_time
  ON public.events(action_id, occurred_at DESC)
  WHERE action_id IS NOT NULL;

CREATE INDEX idx_events_actor_time
  ON public.events(actor_id, occurred_at DESC)
  WHERE actor_id IS NOT NULL;

CREATE INDEX idx_events_context_time
  ON public.events(context_id, occurred_at DESC)
  WHERE context_id IS NOT NULL;

ALTER TABLE public.action_outcome_trace
  DROP CONSTRAINT IF EXISTS action_outcome_trace_evidence_id_fkey;

ALTER TABLE public.evidence
  RENAME TO evidences;

ALTER TABLE public.evidences
  DROP CONSTRAINT IF EXISTS evidence_statement_not_null,
  DROP CONSTRAINT IF EXISTS evidence_status_check,
  DROP CONSTRAINT IF EXISTS evidence_status_not_null;

ALTER TABLE public.evidences
  DROP COLUMN status,
  DROP COLUMN statement,
  DROP COLUMN observed_at;

ALTER TABLE public.evidences
  ADD COLUMN event_id text,
  ADD COLUMN verification text NOT NULL,
  ADD COLUMN recorded_at timestamptz NOT NULL,
  ADD COLUMN external_provider text,
  ADD COLUMN external_reference text;

ALTER TABLE public.evidences
  ADD CONSTRAINT evidences_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.events(id),
  ADD CONSTRAINT evidences_source_not_blank
    CHECK (btrim(source) <> ''),
  ADD CONSTRAINT evidences_verification_check
    CHECK (verification IN ('UNVERIFIED','VERIFIED','REJECTED')),
  ADD CONSTRAINT evidences_external_reference_pair_check
    CHECK (
      (external_provider IS NULL AND external_reference IS NULL)
      OR
      (btrim(external_provider) <> '' AND btrim(external_reference) <> '')
    );

CREATE INDEX idx_evidences_event
  ON public.evidences(event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE public.action_outcome_trace
  ADD CONSTRAINT action_outcome_trace_evidence_id_fkey
    FOREIGN KEY (evidence_id) REFERENCES public.evidences(id);

INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('event-evidence-physical-canonicalization-2026-10-02');

COMMIT;
