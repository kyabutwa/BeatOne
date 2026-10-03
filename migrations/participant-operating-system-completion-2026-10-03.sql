-- Zalagren participant operating-system completion
-- 2026-10-03
-- Adds durable activity, notifications, compliance review and support records.
-- These are participant-owned workflow records; they do not assert external regulatory approval.

BEGIN;

CREATE TABLE IF NOT EXISTS public.participant_notifications (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 kind text NOT NULL,
 title text NOT NULL,
 body text NOT NULL,
 severity text NOT NULL DEFAULT 'info',
 read_at timestamptz,
 source_type text,
 source_id text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS participant_notifications_participant_created_idx
 ON public.participant_notifications(participant_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.participant_notification_preferences (
 participant_id text PRIMARY KEY REFERENCES public.participants(id) ON DELETE CASCADE,
 service_messages boolean NOT NULL DEFAULT true,
 community_messages boolean NOT NULL DEFAULT true,
 security_alerts boolean NOT NULL DEFAULT true,
 payment_messages boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.participant_activity (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 event_id text REFERENCES public.events(id) ON DELETE SET NULL,
 activity_type text NOT NULL,
 title text NOT NULL,
 summary text,
 status text NOT NULL DEFAULT 'completed',
 context_type text,
 context_id text,
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS participant_activity_participant_occurred_idx
 ON public.participant_activity(participant_id,occurred_at DESC);

CREATE TABLE IF NOT EXISTS public.participant_compliance_reviews (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 jurisdiction text NOT NULL,
 domain text NOT NULL,
 requirement_code text NOT NULL,
 status text NOT NULL DEFAULT 'supported',
 evidence_id text REFERENCES public.evidences(id) ON DELETE SET NULL,
 notes text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(participant_id,jurisdiction,domain,requirement_code)
);

CREATE INDEX IF NOT EXISTS participant_compliance_reviews_participant_idx
 ON public.participant_compliance_reviews(participant_id,domain,status);

CREATE TABLE IF NOT EXISTS public.support_requests (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 category text NOT NULL,
 subject text NOT NULL,
 description text NOT NULL,
 status text NOT NULL DEFAULT 'open',
 priority text NOT NULL DEFAULT 'normal',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_requests_participant_idx
 ON public.support_requests(participant_id,created_at DESC);

INSERT INTO public.zalagren_schema_migrations(id,applied_at)
VALUES('participant-operating-system-completion-2026-10-03',now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
