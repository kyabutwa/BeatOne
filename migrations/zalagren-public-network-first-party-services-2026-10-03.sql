-- Zalagren public participation + first-party service network foundation
-- 2026-10-03
-- Non-destructive: additive tables/columns only.

BEGIN;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS owner_mode text NOT NULL DEFAULT 'platform_coordinated',
  ADD COLUMN IF NOT EXISTS public_visibility text NOT NULL DEFAULT 'authenticated',
  ADD COLUMN IF NOT EXISTS provider_joinable boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS first_party boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS launch_state text NOT NULL DEFAULT 'supported';

DO $$ BEGIN
  ALTER TABLE public.services ADD CONSTRAINT services_owner_mode_check
    CHECK (owner_mode IN ('first_party','platform_coordinated','regulated_provider','community_coordinated'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.services ADD CONSTRAINT services_public_visibility_check
    CHECK (public_visibility IN ('authenticated','community','private'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.services ADD CONSTRAINT services_launch_state_check
    CHECK (launch_state IN ('ready','supported','proposed','regulated_pending'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.service_provider_profiles (
  id text PRIMARY KEY,
  service_id text NOT NULL REFERENCES public.services(id),
  participant_id text NOT NULL REFERENCES public.participants(id),
  provider_kind text NOT NULL DEFAULT 'individual',
  display_name text NOT NULL,
  service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed',
  verification_state text NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, participant_id)
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES public.participants(id),
  legal_name text,
  trading_name text NOT NULL,
  category text NOT NULL,
  service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_state text NOT NULL DEFAULT 'proposed',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, trading_name)
);

CREATE TABLE IF NOT EXISTS public.zalagren_invitations (
  id text PRIMARY KEY,
  inviter_participant_id text NOT NULL REFERENCES public.participants(id),
  invitation_type text NOT NULL,
  target_name text,
  target_contact text,
  target_reference text,
  community_id text REFERENCES public.communities(id),
  business_id text REFERENCES public.business_profiles(id),
  service_id text REFERENCES public.services(id),
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_by_participant_id text REFERENCES public.participants(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatride_vehicles (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES public.participants(id),
  profile_id text NOT NULL REFERENCES public.beatride_profiles(id),
  registration_reference text NOT NULL,
  vehicle_type text NOT NULL,
  make_model text,
  capacity integer,
  status text NOT NULL DEFAULT 'proposed',
  verification_state text NOT NULL DEFAULT 'proposed',
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatride_driver_presence (
  profile_id text PRIMARY KEY REFERENCES public.beatride_profiles(id),
  availability text NOT NULL DEFAULT 'offline',
  latitude numeric,
  longitude numeric,
  location_accuracy_m numeric,
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatride_dispatch_offers (
  id text PRIMARY KEY,
  request_id text NOT NULL REFERENCES public.beatride_requests(id),
  driver_profile_id text NOT NULL REFERENCES public.beatride_profiles(id),
  vehicle_id text REFERENCES public.beatride_vehicles(id),
  status text NOT NULL DEFAULT 'offered',
  offered_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS public.beatride_trips (
  id text PRIMARY KEY,
  request_id text NOT NULL UNIQUE REFERENCES public.beatride_requests(id),
  rider_participant_id text NOT NULL REFERENCES public.participants(id),
  driver_profile_id text NOT NULL REFERENCES public.beatride_profiles(id),
  vehicle_id text REFERENCES public.beatride_vehicles(id),
  status text NOT NULL DEFAULT 'accepted',
  agreed_fare_minor integer,
  currency char(3) DEFAULT 'KES',
  pickup_confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_provider_profiles_service
  ON public.service_provider_profiles(service_id, status);
CREATE INDEX IF NOT EXISTS idx_service_provider_profiles_participant
  ON public.service_provider_profiles(participant_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter
  ON public.zalagren_invitations(inviter_participant_id, status);
CREATE INDEX IF NOT EXISTS idx_invitations_target
  ON public.zalagren_invitations(target_contact, status);
CREATE INDEX IF NOT EXISTS idx_beatride_presence
  ON public.beatride_driver_presence(availability, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_beatride_dispatch_request
  ON public.beatride_dispatch_offers(request_id, status);
CREATE INDEX IF NOT EXISTS idx_beatride_trips_driver
  ON public.beatride_trips(driver_profile_id, status);

UPDATE public.services
SET owner_mode='first_party', first_party=true, public_visibility='authenticated',
    provider_joinable=true, launch_state='ready'
WHERE name IN ('BeatRide','BeatFood','BeatMarket','BeatGenzi');

UPDATE public.services
SET owner_mode='platform_coordinated', first_party=false, public_visibility='authenticated',
    provider_joinable=true, launch_state='supported'
WHERE name IN ('BeatPay','BeatHealth','BeatGuardian','BeatUtilities');

INSERT INTO public.zalagren_schema_migrations(id)
SELECT 'zalagren-public-network-first-party-services-2026-10-03'
WHERE NOT EXISTS (
  SELECT 1 FROM public.zalagren_schema_migrations
  WHERE id='zalagren-public-network-first-party-services-2026-10-03'
);

COMMIT;
