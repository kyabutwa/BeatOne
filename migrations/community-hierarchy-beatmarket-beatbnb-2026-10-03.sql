-- Zalagren Community hierarchy + BeatMarket + BeatBnB
-- 2026-10-03
-- BeatMarket and BeatBnB are separate bounded domains.
-- Community spatial hierarchy remains canonical through places.parent_id.

BEGIN;

ALTER TABLE public.places ADD COLUMN IF NOT EXISTS standard_code text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS occupancy_status text DEFAULT 'available';
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS access_policy jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS places_community_type_parent_idx ON public.places(community_id,type,parent_id);

CREATE TABLE IF NOT EXISTS public.community_reserved_spaces (
 id text PRIMARY KEY,
 community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
 place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 name text NOT NULL,
 reservation_type text NOT NULL,
 status text NOT NULL DEFAULT 'available',
 capacity integer,
 rules jsonb NOT NULL DEFAULT '{}'::jsonb,
 authorization_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_profiles (
 id text PRIMARY KEY,
 participant_id text NOT NULL UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE,
 professional_name text, headline text, biography text,
 profile_type text NOT NULL DEFAULT 'professional',
 location_place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 location_privacy text NOT NULL DEFAULT 'approximate',
 availability jsonb NOT NULL DEFAULT '{}'::jsonb,
 skills jsonb NOT NULL DEFAULT '[]'::jsonb,
 services jsonb NOT NULL DEFAULT '[]'::jsonb,
 experience jsonb NOT NULL DEFAULT '[]'::jsonb,
 education jsonb NOT NULL DEFAULT '[]'::jsonb,
 credentials jsonb NOT NULL DEFAULT '[]'::jsonb,
 business_links jsonb NOT NULL DEFAULT '[]'::jsonb,
 contact_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
 verification_state text NOT NULL DEFAULT 'proposed',
 reputation_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_opportunities (
 id text PRIMARY KEY,
 created_by_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 community_id text REFERENCES public.communities(id) ON DELETE SET NULL,
 title text NOT NULL, description text NOT NULL, opportunity_type text NOT NULL,
 category text, compensation_minor integer, currency char(3) NOT NULL DEFAULT 'KES',
 location_place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 remote_allowed boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'open',
 requirements jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_connections (
 id text PRIMARY KEY,
 requester_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 target_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 connection_type text NOT NULL DEFAULT 'professional',
 status text NOT NULL DEFAULT 'pending', message text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(requester_participant_id,target_participant_id,connection_type)
);

CREATE TABLE IF NOT EXISTS public.beatmarket_business_profiles (
 id text PRIMARY KEY,
 participant_id text REFERENCES public.participants(id) ON DELETE CASCADE,
 community_id text REFERENCES public.communities(id) ON DELETE SET NULL,
 legal_name text, trading_name text NOT NULL, registration_number text,
 tax_identifier_last4 text, business_type text, description text,
 categories jsonb NOT NULL DEFAULT '[]'::jsonb,
 location_place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 public_location_mode text NOT NULL DEFAULT 'approximate',
 website text, social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
 contact_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
 verification_state text NOT NULL DEFAULT 'proposed',
 compliance_state text NOT NULL DEFAULT 'supported',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_business_offers (
 id text PRIMARY KEY,
 business_profile_id text NOT NULL REFERENCES public.beatmarket_business_profiles(id) ON DELETE CASCADE,
 title text NOT NULL, description text, offer_type text NOT NULL,
 price_minor integer, currency char(3) NOT NULL DEFAULT 'KES',
 availability jsonb NOT NULL DEFAULT '{}'::jsonb, fulfillment_mode text,
 status text NOT NULL DEFAULT 'draft',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_location_states (
 id text PRIMARY KEY,
 participant_id text REFERENCES public.participants(id) ON DELETE CASCADE,
 business_profile_id text REFERENCES public.beatmarket_business_profiles(id) ON DELETE CASCADE,
 mode text NOT NULL, latitude double precision, longitude double precision,
 accuracy_meters double precision, geometry_geojson jsonb,
 visibility text NOT NULL DEFAULT 'private', expires_at timestamptz,
 captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_messages (
 id text PRIMARY KEY,
 sender_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 recipient_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 channel text NOT NULL DEFAULT 'zalagren',
 external_provider text, external_reference text, body text NOT NULL,
 status text NOT NULL DEFAULT 'queued', created_at timestamptz NOT NULL DEFAULT now(),
 delivered_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.beatbnb_properties (
 id text PRIMARY KEY,
 community_id text REFERENCES public.communities(id) ON DELETE SET NULL,
 unit_place_id text NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
 provider_participant_id text REFERENCES public.participants(id) ON DELETE SET NULL,
 host_participant_id text REFERENCES public.participants(id) ON DELETE SET NULL,
 listing_status text NOT NULL DEFAULT 'draft', accommodation_type text NOT NULL,
 stay_model text NOT NULL DEFAULT 'short_stay', title text NOT NULL, description text,
 standard_price_minor integer, currency char(3) NOT NULL DEFAULT 'KES',
 pricing_model text NOT NULL DEFAULT 'nightly', location_precision text NOT NULL DEFAULT 'community',
 reputation_summary jsonb NOT NULL DEFAULT '{}'::jsonb, amenities jsonb NOT NULL DEFAULT '[]'::jsonb,
 house_rules jsonb NOT NULL DEFAULT '{}'::jsonb, capacity jsonb NOT NULL DEFAULT '{}'::jsonb,
 unit_details jsonb NOT NULL DEFAULT '{}'::jsonb, verification_state text NOT NULL DEFAULT 'proposed',
 compliance_state text NOT NULL DEFAULT 'supported',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_stays (
 id text PRIMARY KEY,
 property_id text NOT NULL REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 guest_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
 resident_participant_id text REFERENCES public.participants(id) ON DELETE SET NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
 guest_count integer NOT NULL DEFAULT 1, status text NOT NULL DEFAULT 'requested',
 total_amount_minor integer, currency char(3) NOT NULL DEFAULT 'KES',
 pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb, guest_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 cancellation_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_access_requests (
 id text PRIMARY KEY,
 stay_id text NOT NULL REFERENCES public.beatbnb_stays(id) ON DELETE CASCADE,
 guest_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 place_id text NOT NULL REFERENCES public.places(id) ON DELETE RESTRICT,
 requested_role text NOT NULL DEFAULT 'guest', route_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
 requested_from timestamptz NOT NULL, requested_until timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'proposed',
 authorization_id text REFERENCES public.authorizations(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_unit_profiles (
 property_id text PRIMARY KEY REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 bedrooms numeric, bathrooms numeric, floor_area_sqm numeric, furnishing text, floor_level text,
 parking jsonb NOT NULL DEFAULT '{}'::jsonb, utilities jsonb NOT NULL DEFAULT '{}'::jsonb,
 safety_features jsonb NOT NULL DEFAULT '[]'::jsonb, accessibility_features jsonb NOT NULL DEFAULT '[]'::jsonb,
 inventory jsonb NOT NULL DEFAULT '[]'::jsonb, inspection_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_price_observations (
 id text PRIMARY KEY,
 property_id text REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 community_id text REFERENCES public.communities(id) ON DELETE SET NULL,
 location_context jsonb NOT NULL DEFAULT '{}'::jsonb,
 comparable_count integer NOT NULL DEFAULT 0,
 observed_min_minor integer, observed_median_minor integer, observed_max_minor integer,
 currency char(3) NOT NULL DEFAULT 'KES', source_type text NOT NULL,
 source_reference text, observed_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.zalagren_schema_migrations(id,applied_at)
VALUES('community-hierarchy-beatmarket-beatbnb-2026-10-03',now())
ON CONFLICT(id) DO NOTHING;

COMMIT;
