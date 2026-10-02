-- Zalagren Marketplace maturity + BnB accommodation contract
-- 2026-10-02
-- Additive only. No listings, sellers, reservations or compliance claims are fabricated.
-- Production application remains a separate approval gate.

BEGIN;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS listing_kind text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS provider_kind text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS fulfillment_mode text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_state text NOT NULL DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS compliance_state text NOT NULL DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS tax_state text NOT NULL DEFAULT 'not_assessed',
  ADD COLUMN IF NOT EXISTS jurisdiction_country text NOT NULL DEFAULT 'KE',
  ADD COLUMN IF NOT EXISTS terms_version text,
  ADD COLUMN IF NOT EXISTS complaint_channel text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

ALTER TABLE public.marketplace_listings
  DROP CONSTRAINT IF EXISTS marketplace_listings_listing_kind_check,
  DROP CONSTRAINT IF EXISTS marketplace_listings_provider_kind_check,
  DROP CONSTRAINT IF EXISTS marketplace_listings_fulfillment_mode_check,
  DROP CONSTRAINT IF EXISTS marketplace_listings_verification_state_check,
  DROP CONSTRAINT IF EXISTS marketplace_listings_compliance_state_check,
  DROP CONSTRAINT IF EXISTS marketplace_listings_tax_state_check;

ALTER TABLE public.marketplace_listings
  ADD CONSTRAINT marketplace_listings_listing_kind_check
    CHECK (listing_kind IN ('goods','service','asset','project','opportunity','capability','accommodation')),
  ADD CONSTRAINT marketplace_listings_provider_kind_check
    CHECK (provider_kind IN ('individual','business','organization','community')),
  ADD CONSTRAINT marketplace_listings_fulfillment_mode_check
    CHECK (fulfillment_mode IN ('direct','delivery','pickup','digital','appointment','stay','provider_dispatch')),
  ADD CONSTRAINT marketplace_listings_verification_state_check
    CHECK (verification_state IN ('proposed','supported','verified','rejected','expired')),
  ADD CONSTRAINT marketplace_listings_compliance_state_check
    CHECK (compliance_state IN ('proposed','supported','verified','rejected','expired')),
  ADD CONSTRAINT marketplace_listings_tax_state_check
    CHECK (tax_state IN ('not_assessed','not_applicable','seller_managed','etims_pending','etims_supported','etims_verified'));

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_kind_state
  ON public.marketplace_listings(listing_kind, status, verification_state, compliance_state);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_jurisdiction
  ON public.marketplace_listings(jurisdiction_country, status);

CREATE TABLE IF NOT EXISTS public.marketplace_listing_profiles (
  listing_id text PRIMARY KEY REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  summary text,
  service_area jsonb NOT NULL DEFAULT '{}'::jsonb,
  availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  compliance_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  verification_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_listing_media (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  media_type text NOT NULL,
  uri text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_listing_media_status_check CHECK (status IN ('active','disabled'))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listing_media_listing
  ON public.marketplace_listing_media(listing_id, status, sort_order);

CREATE TABLE IF NOT EXISTS public.marketplace_accommodation_profiles (
  listing_id text PRIMARY KEY REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  accommodation_type text NOT NULL,
  stay_type text NOT NULL DEFAULT 'short_stay',
  max_guests integer NOT NULL,
  bedrooms numeric(6,2),
  bathrooms numeric(6,2),
  check_in_time text,
  check_out_time text,
  amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
  house_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  location_visibility text NOT NULL DEFAULT 'approximate',
  address_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_accommodation_profiles_stay_check CHECK (stay_type IN ('short_stay','long_stay','both')),
  CONSTRAINT marketplace_accommodation_profiles_guests_check CHECK (max_guests > 0),
  CONSTRAINT marketplace_accommodation_profiles_location_check CHECK (location_visibility IN ('hidden','approximate','exact'))
);

CREATE TABLE IF NOT EXISTS public.marketplace_reservation_requests (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES public.marketplace_listings(id),
  participant_id text NOT NULL REFERENCES public.participants(id),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  guests integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  provider_reference text,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketplace_reservation_dates_check CHECK (ends_on > starts_on),
  CONSTRAINT marketplace_reservation_guests_check CHECK (guests > 0),
  CONSTRAINT marketplace_reservation_status_check CHECK (status IN ('pending','accepted','rejected','cancelled','completed')),
  UNIQUE (participant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_reservations_listing
  ON public.marketplace_reservation_requests(listing_id, starts_on, ends_on, status);

-- Record the authoritative source without assuming a particular ledger column name.
DO $$
BEGIN
  IF to_regclass('public.zalagren_schema_migrations') IS NULL THEN
    RAISE EXCEPTION 'ZALAGREN_MIGRATION_LEDGER_MISSING';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='zalagren_schema_migrations' AND column_name='migration_id'
  ) THEN
    INSERT INTO public.zalagren_schema_migrations (migration_id, applied_at)
    VALUES ('marketplace-maturity-2026-10-02', now())
    ON CONFLICT (migration_id) DO NOTHING;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='zalagren_schema_migrations' AND column_name='id'
  ) THEN
    INSERT INTO public.zalagren_schema_migrations (id)
    VALUES ('marketplace-maturity-2026-10-02')
    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE EXCEPTION 'ZALAGREN_MIGRATION_LEDGER_COLUMN_MISSING';
  END IF;
END $$;

COMMIT;
