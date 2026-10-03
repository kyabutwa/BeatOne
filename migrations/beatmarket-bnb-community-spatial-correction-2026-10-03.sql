-- Zalagren spatial community + BeatMarket + BeatBnB correction
-- 2026-10-03
-- Community spatial hierarchy is distinct from service/application domains.
-- BeatMarket and BeatBnB are separate products and separate lifecycle owners.

BEGIN;

CREATE TABLE IF NOT EXISTS public.community_spatial_nodes (
 id text PRIMARY KEY,
 community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
 place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 parent_node_id text REFERENCES public.community_spatial_nodes(id) ON DELETE CASCADE,
 node_type text NOT NULL,
 name text NOT NULL,
 code text,
 status text NOT NULL DEFAULT 'active',
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (node_type IN ('place','phase','building','floor','common_area','unit','reserved_space')),
 UNIQUE (community_id,code)
);

CREATE INDEX IF NOT EXISTS community_spatial_nodes_parent_idx
 ON public.community_spatial_nodes(community_id,parent_node_id,node_type,status);

CREATE TABLE IF NOT EXISTS public.beatmarket_professional_profiles (
 participant_id text PRIMARY KEY REFERENCES public.participants(id) ON DELETE CASCADE,
 headline text, bio text, skills jsonb NOT NULL DEFAULT '[]'::jsonb,
 services jsonb NOT NULL DEFAULT '[]'::jsonb, experience jsonb NOT NULL DEFAULT '[]'::jsonb,
 education jsonb NOT NULL DEFAULT '[]'::jsonb, portfolio jsonb NOT NULL DEFAULT '[]'::jsonb,
 availability jsonb NOT NULL DEFAULT '{}'::jsonb, verification_state text NOT NULL DEFAULT 'proposed',
 jurisdiction_country text NOT NULL DEFAULT 'KE',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_business_profiles (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 legal_name text, display_name text NOT NULL, business_type text, kra_pin_last4 text,
 registration_reference text, description text, categories jsonb NOT NULL DEFAULT '[]'::jsonb,
 verification_state text NOT NULL DEFAULT 'proposed', compliance_state text NOT NULL DEFAULT 'proposed',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_opportunities (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 opportunity_type text NOT NULL, title text NOT NULL, description text NOT NULL,
 location jsonb NOT NULL DEFAULT '{}'::jsonb, compensation_minor integer, currency char(3) NOT NULL DEFAULT 'KES',
 remote_mode text NOT NULL DEFAULT 'flexible', status text NOT NULL DEFAULT 'draft',
 verification_state text NOT NULL DEFAULT 'proposed', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_connections (
 id text PRIMARY KEY, requester_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 target_participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(requester_participant_id,target_participant_id),
 CHECK(requester_participant_id<>target_participant_id)
);

CREATE TABLE IF NOT EXISTS public.beatmarket_posts (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 post_type text NOT NULL DEFAULT 'update', body text NOT NULL,
 media jsonb NOT NULL DEFAULT '[]'::jsonb, place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 visibility text NOT NULL DEFAULT 'network', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_storefronts (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 business_profile_id text REFERENCES public.beatmarket_business_profiles(id) ON DELETE SET NULL,
 name text NOT NULL, description text, catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
 fulfillment jsonb NOT NULL DEFAULT '{}'::jsonb, tax_state text NOT NULL DEFAULT 'not_assessed',
 verification_state text NOT NULL DEFAULT 'proposed', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatmarket_location_sessions (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 mode text NOT NULL, precision_level text NOT NULL DEFAULT 'approximate',
 latitude double precision, longitude double precision, place_id text REFERENCES public.places(id) ON DELETE SET NULL,
 started_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.beatbnb_favorites (
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 property_id text NOT NULL REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(participant_id,property_id)
);

CREATE TABLE IF NOT EXISTS public.beatbnb_reputation_events (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
 stay_id text REFERENCES public.beatbnb_stays(id) ON DELETE SET NULL,
 subject_type text NOT NULL, rating numeric(3,2), comment text,
 evidence jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_discounts (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES public.beatbnb_properties(id) ON DELETE CASCADE,
 code text, label text NOT NULL, discount_type text NOT NULL, value_minor integer,
 percent numeric(5,2), starts_at timestamptz, ends_at timestamptz, active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.beatbnb_travel_searches (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
 origin jsonb NOT NULL, destination jsonb NOT NULL, depart_on date, return_on date,
 passengers integer NOT NULL DEFAULT 1, cabin text, filters jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'search', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beatbnb_travel_options (
 id text PRIMARY KEY, search_id text NOT NULL REFERENCES public.beatbnb_travel_searches(id) ON DELETE CASCADE,
 mode text NOT NULL, provider_name text, provider_reference text, itinerary jsonb NOT NULL DEFAULT '{}'::jsonb,
 price_minor integer, currency char(3), availability_state text NOT NULL DEFAULT 'unknown',
 booking_mode text NOT NULL DEFAULT 'external', compliance_state text NOT NULL DEFAULT 'supported'
);

CREATE TABLE IF NOT EXISTS public.beatbnb_travel_reservations (
 id text PRIMARY KEY, participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
 option_id text NOT NULL REFERENCES public.beatbnb_travel_options(id) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'requested', external_reference text, payment_intent_id text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.services(id,name,domain,status)
VALUES('service-beatbnb','BeatBnB','accommodation','available')
ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,domain=EXCLUDED.domain,status=EXCLUDED.status;

INSERT INTO public.capabilities(id,service_id,name,action,allowed_roles,requires_explicit_authorization,resource_type,scope)
VALUES
('cap-beatbnb-list','service-beatbnb','Create accommodation listing','bnb.listing.create','["participant","host","provider"]'::jsonb,true,'accommodation','["participant","community","place"]'::jsonb),
('cap-beatbnb-book','service-beatbnb','Request accommodation booking','bnb.booking.create','["participant","guest"]'::jsonb,true,'reservation','["participant","community","place"]'::jsonb),
('cap-beatbnb-access','service-beatbnb','Manage guest access','bnb.access.manage','["host","provider","community_manager"]'::jsonb,true,'access','["community","place","unit"]'::jsonb),
('cap-beatbnb-travel','service-beatbnb','Request travel booking','bnb.travel.request','["participant","guest"]'::jsonb,true,'travel','["participant","destination"]'::jsonb)
ON CONFLICT(id) DO UPDATE SET service_id=EXCLUDED.service_id,name=EXCLUDED.name,action=EXCLUDED.action,
allowed_roles=EXCLUDED.allowed_roles,requires_explicit_authorization=EXCLUDED.requires_explicit_authorization,
resource_type=EXCLUDED.resource_type,scope=EXCLUDED.scope;

INSERT INTO public.zalagren_schema_migrations(id)
VALUES('beatmarket-bnb-community-spatial-correction-2026-10-03')
ON CONFLICT(id) DO NOTHING;

COMMIT;
