-- BeatOne canonical Account / Verification / Device protocol
-- Migration ID: beatone-account-verification-device-protocol-2026-10-02
-- Provider codes/secrets remain outside BeatOne persistence.
-- This ledger stores orchestration state, not OTP values.

BEGIN;

CREATE TABLE IF NOT EXISTS public.account_devices (
  id text NOT NULL,
  account_id text NOT NULL,
  device_key_hash text NOT NULL,
  platform text NOT NULL,
  label text,
  status text NOT NULL DEFAULT 'ACTIVE',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  trusted_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT account_devices_pkey PRIMARY KEY (id),
  CONSTRAINT account_devices_account_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT account_devices_status_check CHECK (status IN ('ACTIVE','REVOKED','PENDING')),
  CONSTRAINT account_devices_platform_check CHECK (platform IN ('ios','android','web','desktop','unknown')),
  CONSTRAINT account_devices_key_hash_check CHECK (length(device_key_hash) = 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_account_devices_account_key
  ON public.account_devices(account_id, device_key_hash);
CREATE INDEX IF NOT EXISTS idx_account_devices_account_status
  ON public.account_devices(account_id, status);

CREATE TABLE IF NOT EXISTS public.verification_challenges (
  id text NOT NULL,
  account_id text NOT NULL,
  identity_id text NOT NULL,
  channel text NOT NULL,
  target_hash text NOT NULL,
  provider text NOT NULL,
  provider_reference text,
  status text NOT NULL DEFAULT 'PENDING',
  requested_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  superseded_at timestamptz,
  verified_at timestamptz,
  failed_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error_code text,
  CONSTRAINT verification_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT verification_challenges_account_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT verification_challenges_identity_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
  CONSTRAINT verification_challenges_channel_check CHECK (channel IN ('email','phone')),
  CONSTRAINT verification_challenges_provider_check CHECK (provider IN ('neon_auth','twilio_verify')),
  CONSTRAINT verification_challenges_status_check CHECK (status IN ('PENDING','VERIFIED','FAILED','EXPIRED','SUPERSEDED')),
  CONSTRAINT verification_challenges_attempt_check CHECK (attempt_count >= 0),
  CONSTRAINT verification_challenges_expiry_check CHECK (expires_at > requested_at),
  CONSTRAINT verification_challenges_target_hash_check CHECK (length(target_hash) = 64)
);

CREATE INDEX IF NOT EXISTS idx_verification_challenges_account
  ON public.verification_challenges(account_id, channel, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_challenges_identity
  ON public.verification_challenges(identity_id, channel, requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_verification_challenges_pending_target
  ON public.verification_challenges(account_id, channel, target_hash)
  WHERE status = 'PENDING';

INSERT INTO public.zalagren_schema_migrations (id, applied_at)
VALUES ('beatone-account-verification-device-protocol-2026-10-02', now())
ON CONFLICT (id) DO NOTHING;

COMMIT;