BEGIN;

CREATE TABLE IF NOT EXISTS public.beathealth_facilities (
  id text PRIMARY KEY,
  provider_profile_id text REFERENCES public.beathealth_provider_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  facility_type text NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  verification_state text NOT NULL DEFAULT 'proposed',
  location jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_workers (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES public.participants(id),
  facility_id text NOT NULL REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  worker_type text NOT NULL,
  professional_title text,
  license_reference text,
  verification_state text NOT NULL DEFAULT 'proposed',
  employment_state text NOT NULL DEFAULT 'proposed',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_worker_authorizations (
  id text PRIMARY KEY,
  worker_id text NOT NULL REFERENCES public.beathealth_workers(id) ON DELETE CASCADE,
  facility_id text NOT NULL REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  authorization_type text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed',
  granted_by_participant_id text REFERENCES public.participants(id),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_worker_schedules (
  id text PRIMARY KEY,
  worker_id text NOT NULL REFERENCES public.beathealth_workers(id) ON DELETE CASCADE,
  facility_id text NOT NULL REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  schedule_type text NOT NULL DEFAULT 'shift',
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.beathealth_departments (
  id text PRIMARY KEY,
  facility_id text NOT NULL REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(facility_id,name)
);

CREATE TABLE IF NOT EXISTS public.beathealth_clinical_services (
  id text PRIMARY KEY,
  facility_id text NOT NULL REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  department_id text REFERENCES public.beathealth_departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  service_type text NOT NULL,
  availability_state text NOT NULL DEFAULT 'proposed',
  price_minor bigint,
  currency char(3) DEFAULT 'KES',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_provider_availability (
  id text PRIMARY KEY,
  provider_profile_id text NOT NULL REFERENCES public.beathealth_provider_profiles(id) ON DELETE CASCADE,
  facility_id text REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  availability_state text NOT NULL DEFAULT 'available',
  booking_state text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.beathealth_medicine_products (
  id text PRIMARY KEY,
  facility_id text REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  pharmacy_provider_profile_id text REFERENCES public.beathealth_provider_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  generic_name text,
  dosage_form text,
  strength text,
  pack_size text,
  product_reference text,
  regulatory_state text NOT NULL DEFAULT 'proposed',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_medicine_inventory (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.beathealth_medicine_products(id) ON DELETE CASCADE,
  facility_id text REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  quantity_available bigint,
  availability_state text NOT NULL DEFAULT 'unknown',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_pharmacy_orders (
  id text PRIMARY KEY,
  patient_participant_id text NOT NULL REFERENCES public.participants(id),
  pharmacy_provider_profile_id text REFERENCES public.beathealth_provider_profiles(id),
  delivery_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'requested',
  private_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_pharmacy_order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES public.beathealth_pharmacy_orders(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.beathealth_medicine_products(id),
  quantity bigint NOT NULL CHECK (quantity > 0),
  fulfillment_state text NOT NULL DEFAULT 'requested'
);

CREATE TABLE IF NOT EXISTS public.beathealth_deliveries (
  id text PRIMARY KEY,
  patient_participant_id text NOT NULL REFERENCES public.participants(id),
  pharmacy_order_id text REFERENCES public.beathealth_pharmacy_orders(id) ON DELETE SET NULL,
  pickup_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  dropoff_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  courier_participant_id text REFERENCES public.participants(id),
  status text NOT NULL DEFAULT 'requested',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_insurance_providers (
  id text PRIMARY KEY,
  name text NOT NULL,
  provider_reference text,
  verification_state text NOT NULL DEFAULT 'proposed',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_insurance_policies (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES public.participants(id),
  insurer_id text NOT NULL REFERENCES public.beathealth_insurance_providers(id),
  policy_reference text,
  coverage_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification_state text NOT NULL DEFAULT 'proposed',
  status text NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_insurance_authorizations (
  id text PRIMARY KEY,
  policy_id text NOT NULL REFERENCES public.beathealth_insurance_policies(id) ON DELETE CASCADE,
  appointment_id text REFERENCES public.beathealth_appointments(id) ON DELETE SET NULL,
  requested_amount_minor bigint,
  currency char(3) DEFAULT 'KES',
  status text NOT NULL DEFAULT 'requested',
  provider_reference text,
  private_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_consents (
  id text PRIMARY KEY,
  patient_participant_id text NOT NULL REFERENCES public.participants(id),
  grantee_participant_id text REFERENCES public.participants(id),
  facility_id text REFERENCES public.beathealth_facilities(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.beathealth_audit_events (
  id text PRIMARY KEY,
  actor_participant_id text REFERENCES public.participants(id),
  patient_participant_id text REFERENCES public.participants(id),
  facility_id text REFERENCES public.beathealth_facilities(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  outcome text NOT NULL DEFAULT 'success',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beathealth_community_context (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  health_service_id text REFERENCES public.beathealth_clinical_services(id) ON DELETE SET NULL,
  context_type text NOT NULL,
  visibility_state text NOT NULL DEFAULT 'community',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bh_facility_location ON public.beathealth_facilities USING gin(location);
CREATE INDEX IF NOT EXISTS idx_bh_workers_facility ON public.beathealth_workers(facility_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_worker_auth ON public.beathealth_worker_authorizations(worker_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_worker_schedule ON public.beathealth_worker_schedules(worker_id,starts_at,ends_at);
CREATE INDEX IF NOT EXISTS idx_bh_service_facility ON public.beathealth_clinical_services(facility_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_availability ON public.beathealth_provider_availability(provider_profile_id,starts_at,ends_at,booking_state);
CREATE INDEX IF NOT EXISTS idx_bh_products ON public.beathealth_medicine_products(facility_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_inventory ON public.beathealth_medicine_inventory(product_id,availability_state);
CREATE INDEX IF NOT EXISTS idx_bh_pharmacy_orders ON public.beathealth_pharmacy_orders(patient_participant_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_bh_deliveries ON public.beathealth_deliveries(patient_participant_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_bh_insurance_policy ON public.beathealth_insurance_policies(participant_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_consents_patient ON public.beathealth_consents(patient_participant_id,status);
CREATE INDEX IF NOT EXISTS idx_bh_audit_patient ON public.beathealth_audit_events(patient_participant_id,created_at);
CREATE INDEX IF NOT EXISTS idx_bh_community ON public.beathealth_community_context(community_id,status);

INSERT INTO public.zalagren_schema_migrations(id)
VALUES ('zalagren-beathealth-operating-fabric-2026-10-03')
ON CONFLICT (id) DO NOTHING;

COMMIT;