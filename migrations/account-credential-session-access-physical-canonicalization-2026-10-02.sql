-- Account / Credential / Session / Access physical canonicalization
-- Migration ID: account-credential-session-access-physical-canonicalization-2026-10-02
-- Scope: public.accounts, canonical Credential ownership, public.sessions, public.accesses.
-- Preconditions: identities and participants are already canonical and all affected tables are empty.
-- Provider auth tables remain separate infrastructure.
-- Production execution is a separate explicit gate.

BEGIN;

-- Guard the exact zero-data/absence preconditions without procedural SQL.
SELECT 1 / CASE
  WHEN to_regclass('public.zalagren_schema_migrations') IS NOT NULL
   AND to_regclass('public.identities') IS NOT NULL
   AND to_regclass('public.participants') IS NOT NULL
   AND to_regclass('public.credentials') IS NOT NULL
   AND to_regclass('public.accounts') IS NULL
   AND to_regclass('public.sessions') IS NULL
   AND to_regclass('public.accesses') IS NULL
   AND (SELECT count(*) FROM public.identities) = 0
   AND (SELECT count(*) FROM public.participants) = 0
   AND (SELECT count(*) FROM public.credentials) = 0
   AND NOT EXISTS (
     SELECT 1 FROM public.zalagren_schema_migrations
     WHERE id = 'account-credential-session-access-physical-canonicalization-2026-10-02'
   )
  THEN 1
  ELSE 0
END;

CREATE TABLE public.accounts (
  id text NOT NULL,
  identity_id text NOT NULL,
  status text NOT NULL,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_identity_id_fkey
    FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT accounts_status_check
    CHECK (status IN ('ACTIVE','SUSPENDED','CLOSED'))
);

CREATE INDEX idx_accounts_identity_id
  ON public.accounts(identity_id);

ALTER TABLE public.credentials
  DROP CONSTRAINT IF EXISTS credentials_identity_id_fkey,
  DROP CONSTRAINT IF EXISTS credentials_identity_id_not_null,
  DROP CONSTRAINT IF EXISTS credentials_status_check,
  DROP CONSTRAINT IF EXISTS credentials_created_at_not_null;

ALTER TABLE public.credentials
  DROP COLUMN IF EXISTS identity_id,
  DROP COLUMN IF EXISTS public_key,
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.credentials
  ADD COLUMN account_id text NOT NULL,
  ADD CONSTRAINT credentials_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  ADD CONSTRAINT credentials_status_check
    CHECK (status IN ('ACTIVE','REVOKED','EXPIRED'));

CREATE INDEX idx_credentials_account_id
  ON public.credentials(account_id);

CREATE TABLE public.sessions (
  id text NOT NULL,
  account_id text NOT NULL,
  authenticated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

CREATE INDEX idx_sessions_account_id
  ON public.sessions(account_id);

CREATE INDEX idx_sessions_expires_at
  ON public.sessions(expires_at);

CREATE TABLE public.accesses (
  id text NOT NULL,
  participant_id text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  mode text NOT NULL,
  CONSTRAINT accesses_pkey PRIMARY KEY (id),
  CONSTRAINT accesses_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES public.participants(id),
  CONSTRAINT accesses_target_type_check
    CHECK (target_type IN ('place','building','floor','unit','resource','service','digital')),
  CONSTRAINT accesses_mode_check
    CHECK (mode IN ('physical','digital','service','resource','contextual','temporary','delegated'))
);

CREATE INDEX idx_accesses_participant_id
  ON public.accesses(participant_id);

CREATE INDEX idx_accesses_target
  ON public.accesses(target_type, target_id);

-- Register applied state only after the complete schema change succeeds.
INSERT INTO public.zalagren_schema_migrations (id)
VALUES ('account-credential-session-access-physical-canonicalization-2026-10-02');

COMMIT;
