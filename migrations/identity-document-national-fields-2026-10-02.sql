-- Expand identity document contract for jurisdiction-specific national identifiers
-- Migration ID: identity-document-national-fields-2026-10-02
BEGIN;
ALTER TABLE public.identity_documents
  ADD COLUMN IF NOT EXISTS national_identifier_ciphertext text,
  ADD COLUMN IF NOT EXISTS national_identifier_hash text,
  ADD COLUMN IF NOT EXISTS national_identifier_last4 text,
  ADD COLUMN IF NOT EXISTS document_serial_ciphertext text,
  ADD COLUMN IF NOT EXISTS document_serial_hash text,
  ADD COLUMN IF NOT EXISTS document_serial_last4 text,
  ADD COLUMN IF NOT EXISTS issue_place text;

CREATE INDEX IF NOT EXISTS idx_identity_documents_national_identifier_hash
  ON public.identity_documents(national_identifier_hash)
  WHERE national_identifier_hash IS NOT NULL;

INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('identity-document-national-fields-2026-10-02')
ON CONFLICT (id) DO NOTHING;
COMMIT;