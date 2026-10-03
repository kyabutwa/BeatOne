BEGIN;

CREATE TABLE IF NOT EXISTS public.beatguardian_contacts (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 name text NOT NULL,
 relationship text,
 contact text NOT NULL,
 status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.beatguardian_incidents (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 community_id text REFERENCES public.communities(id),
 incident_type text NOT NULL,
 severity text NOT NULL DEFAULT 'normal',
 location jsonb NOT NULL DEFAULT '{}'::jsonb,
 description text,
 status text NOT NULL DEFAULT 'open',
 created_at timestamptz NOT NULL DEFAULT now(),
 acknowledged_at timestamptz,
 resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.beatguardian_checkins (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 trusted_contact_id text REFERENCES public.beatguardian_contacts(id),
 destination text,
 eta timestamptz,
 status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.beathealth_provider_profiles (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 provider_type text NOT NULL,
 facility_name text,
 specialty text,
 service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
 verification_state text NOT NULL DEFAULT 'proposed',
 status text NOT NULL DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.beathealth_appointments (
 id text PRIMARY KEY,
 patient_participant_id text NOT NULL REFERENCES public.participants(id),
 provider_profile_id text NOT NULL REFERENCES public.beathealth_provider_profiles(id),
 scheduled_at timestamptz NOT NULL,
 reason text,
 status text NOT NULL DEFAULT 'requested',
 private_context jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.beathealth_referrals (
 id text PRIMARY KEY,
 patient_participant_id text NOT NULL REFERENCES public.participants(id),
 source_provider_id text REFERENCES public.beathealth_provider_profiles(id),
 destination_provider_id text REFERENCES public.beathealth_provider_profiles(id),
 purpose text NOT NULL,
 status text NOT NULL DEFAULT 'proposed',
 private_context jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatpay_intents (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 service_name text NOT NULL,
 amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
 currency char(3) NOT NULL DEFAULT 'KES',
 idempotency_key text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'created',
 rail text,
 provider_reference text,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.beatpay_ledger_entries (
 id text PRIMARY KEY,
 payment_intent_id text NOT NULL REFERENCES public.beatpay_intents(id),
 account_reference text NOT NULL,
 entry_type text NOT NULL,
 amount_minor bigint NOT NULL,
 currency char(3) NOT NULL DEFAULT 'KES',
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatutilities_accounts (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 utility_type text NOT NULL,
 provider_name text,
 provider_account_reference text,
 place_reference text,
 status text NOT NULL DEFAULT 'proposed',
 verification_state text NOT NULL DEFAULT 'proposed',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.beatutilities_requests (
 id text PRIMARY KEY,
 participant_id text NOT NULL REFERENCES public.participants(id),
 account_id text REFERENCES public.beatutilities_accounts(id),
 request_type text NOT NULL,
 description text,
 status text NOT NULL DEFAULT 'requested',
 provider_reference text,
 created_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_guardian_incident_participant ON public.beatguardian_incidents(participant_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_guardian_checkin_participant ON public.beatguardian_checkins(participant_id,status);
CREATE INDEX IF NOT EXISTS idx_health_appointments_patient ON public.beathealth_appointments(patient_participant_id,status,scheduled_at);
CREATE INDEX IF NOT EXISTS idx_health_appointments_provider ON public.beathealth_appointments(provider_profile_id,status,scheduled_at);
CREATE INDEX IF NOT EXISTS idx_pay_intents_participant ON public.beatpay_intents(participant_id,created_at);
CREATE INDEX IF NOT EXISTS idx_utility_requests_participant ON public.beatutilities_requests(participant_id,status);

INSERT INTO public.zalagren_schema_migrations(id)
VALUES ('zalagren-protected-services-foundation-2026-10-03')
ON CONFLICT (id) DO NOTHING;

COMMIT;