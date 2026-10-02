-- Reconcile pre-existing legal identity profile with canonical expanded contract
-- Migration ID: legal-identity-profile-expanded-reconciliation-2026-10-02
-- Additive only; existing rows, IDs, status semantics and constraints are preserved.
BEGIN;

ALTER TABLE public.legal_identity_profiles
  ADD COLUMN IF NOT EXISTS given_names text,
  ADD COLUMN IF NOT EXISTS middle_names text,
  ADD COLUMN IF NOT EXISTS family_name text,
  ADD COLUMN IF NOT EXISTS sex text,
  ADD COLUMN IF NOT EXISTS birth_country_code text,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS residence_country_code text,
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS postal_code text;

CREATE INDEX IF NOT EXISTS idx_legal_identity_profile_status
  ON public.legal_identity_profiles(participant_id, status);

INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('legal-identity-profile-expanded-reconciliation-2026-10-02')
ON CONFLICT (id) DO NOTHING;

COMMIT;