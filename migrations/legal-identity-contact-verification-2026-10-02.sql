-- Legal identity, national document, and verified contact persistence
-- Migration ID: legal-identity-contact-verification-2026-10-02
-- Additive only. Existing identity/account/session rows are preserved.
BEGIN;

CREATE TABLE IF NOT EXISTS public.legal_identity_profiles (
  identity_id text NOT NULL,
  legal_name text NOT NULL,
  given_names text,
  middle_names text,
  family_name text,
  date_of_birth date,
  sex text,
  nationality_country_code text,
  birth_country_code text,
  birth_place text,
  residence_country_code text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  verification_status text NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT legal_identity_profiles_pkey PRIMARY KEY (identity_id),
  CONSTRAINT legal_identity_profiles_identity_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT legal_identity_profiles_name_check CHECK (length(btrim(legal_name)) >= 2),
  CONSTRAINT legal_identity_profiles_verification_status_check CHECK (verification_status IN ('unverified','pending','verified','rejected'))
);

CREATE TABLE IF NOT EXISTS public.identity_documents (
  id text NOT NULL,
  identity_id text NOT NULL,
  document_type text NOT NULL,
  issuing_country_code text NOT NULL,
  issuing_authority text,
  document_number_ciphertext text NOT NULL,
  document_number_hash text NOT NULL,
  document_number_last4 text,
  issue_date date,
  expiry_date date,
  status text NOT NULL DEFAULT 'pending',
  verification_method text,
  verification_reference text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_documents_pkey PRIMARY KEY (id),
  CONSTRAINT identity_documents_identity_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT identity_documents_type_check CHECK (document_type IN ('national_id','passport','residence_permit','refugee_document','other')),
  CONSTRAINT identity_documents_country_check CHECK (issuing_country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT identity_documents_status_check CHECK (status IN ('pending','verified','rejected','expired')),
  CONSTRAINT identity_documents_hash_check CHECK (length(document_number_hash) = 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_documents_identity_hash
  ON public.identity_documents(identity_id, document_number_hash);

CREATE INDEX IF NOT EXISTS idx_identity_documents_identity
  ON public.identity_documents(identity_id, status);

CREATE TABLE IF NOT EXISTS public.identity_contacts (
  id text NOT NULL,
  identity_id text NOT NULL,
  kind text NOT NULL,
  value_normalized text NOT NULL,
  value_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT identity_contacts_pkey PRIMARY KEY (id),
  CONSTRAINT identity_contacts_identity_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT identity_contacts_kind_check CHECK (kind IN ('email','phone')),
  CONSTRAINT identity_contacts_status_check CHECK (status IN ('pending','active','revoked')),
  CONSTRAINT identity_contacts_hash_check CHECK (length(value_hash) = 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_identity_contacts_kind_hash
  ON public.identity_contacts(kind, value_hash);

CREATE INDEX IF NOT EXISTS idx_identity_contacts_identity
  ON public.identity_contacts(identity_id, kind, status);

CREATE TABLE IF NOT EXISTS public.identity_verification_records (
  id text NOT NULL,
  identity_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  method text NOT NULL,
  status text NOT NULL,
  external_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT identity_verification_records_pkey PRIMARY KEY (id),
  CONSTRAINT identity_verification_records_identity_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT identity_verification_records_target_type_check CHECK (target_type IN ('email','phone','national_id','passport','residence_permit','refugee_document','other')),
  CONSTRAINT identity_verification_records_status_check CHECK (status IN ('pending','verified','rejected','expired','failed'))
);

CREATE INDEX IF NOT EXISTS idx_identity_verification_records_identity
  ON public.identity_verification_records(identity_id, created_at DESC);

INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('legal-identity-contact-verification-2026-10-02')
ON CONFLICT (id) DO NOTHING;

COMMIT;