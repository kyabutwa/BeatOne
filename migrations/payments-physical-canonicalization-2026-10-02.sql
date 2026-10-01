-- Payments physical canonicalization migration
-- Migration ID: payments-physical-canonicalization-2026-10-02
-- Scope: canonical public.payments only; legacy payment_intents/payment_events retained.
-- Production execution is NOT authorized by this source.

BEGIN;

DO $$
DECLARE
  v_rows bigint;
BEGIN
  IF to_regclass('public.zalagren_schema_migrations') IS NULL THEN
    RAISE EXCEPTION 'Migration ledger public.zalagren_schema_migrations is missing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.zalagren_schema_migrations WHERE id='payments-physical-canonicalization-2026-10-02') THEN
    RAISE EXCEPTION 'Migration already registered';
  END IF;
  IF to_regclass('public.payments') IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical public.payments already exists';
  END IF;
  IF to_regclass('public.payment_intents') IS NULL OR to_regclass('public.payment_events') IS NULL THEN
    RAISE EXCEPTION 'Expected legacy Payments tables are missing';
  END IF;
  SELECT count(*) INTO v_rows FROM public.payment_intents;
  IF v_rows <> 0 THEN RAISE EXCEPTION 'payment_intents contains % rows; migration has no authorized legacy data transformation', v_rows; END IF;
  SELECT count(*) INTO v_rows FROM public.payment_events;
  IF v_rows <> 0 THEN RAISE EXCEPTION 'payment_events contains % rows; migration has no authorized legacy data transformation', v_rows; END IF;
  IF to_regclass('public.actions') IS NULL THEN RAISE EXCEPTION 'Canonical Action table is missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='actions' AND column_name='actor_id') THEN
    RAISE EXCEPTION 'Canonical Action physical schema is not installed; Payments migration requires Action foundation first';
  END IF;
END $$;

CREATE TABLE public.payments (
  id text PRIMARY KEY,
  payer_participant_id text,
  payee_participant_id text,
  amount numeric NOT NULL,
  currency varchar(3) NOT NULL,
  purpose text NOT NULL,
  status varchar(32) NOT NULL,
  actor_id text NOT NULL,
  authorization_id text NOT NULL,
  action_id text,
  idempotency_key text NOT NULL,
  request_id text,
  correlation_id text,
  causation_id text,
  external_provider text,
  external_reference text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT payments_payer_participant_id_fkey FOREIGN KEY (payer_participant_id) REFERENCES public.participants(id) ON DELETE RESTRICT,
  CONSTRAINT payments_payee_participant_id_fkey FOREIGN KEY (payee_participant_id) REFERENCES public.participants(id) ON DELETE RESTRICT,
  CONSTRAINT payments_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.identities(id) ON DELETE RESTRICT,
  CONSTRAINT payments_authorization_id_fkey FOREIGN KEY (authorization_id) REFERENCES public.authorizations(id) ON DELETE RESTRICT,
  CONSTRAINT payments_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.actions(id) ON DELETE RESTRICT,
  CONSTRAINT payments_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT payments_purpose_not_blank CHECK (btrim(purpose) <> ''),
  CONSTRAINT payments_status_check CHECK (status IN ('REQUESTED','AUTHORIZED','PROCESSING','PENDING','COMPLETED','FAILED','DENIED','REJECTED','CANCELLED','PARTIAL','UNKNOWN','REVERSED','RECONCILIATION_REQUIRED','RECONCILED')),
  CONSTRAINT payments_idempotency_key_not_blank CHECK (btrim(idempotency_key) <> ''),
  CONSTRAINT payments_external_reference_pair_check CHECK ((external_provider IS NULL) = (external_reference IS NULL)),
  CONSTRAINT payments_external_provider_not_blank CHECK (external_provider IS NULL OR btrim(external_provider) <> ''),
  CONSTRAINT payments_external_reference_not_blank CHECK (external_reference IS NULL OR btrim(external_reference) <> ''),
  CONSTRAINT payments_updated_at_check CHECK (updated_at >= created_at),
  CONSTRAINT payments_version_check CHECK (version >= 1)
);

CREATE UNIQUE INDEX payments_idempotency_key_uq ON public.payments(idempotency_key);
CREATE INDEX payments_action_id_idx ON public.payments(action_id) WHERE action_id IS NOT NULL;
CREATE INDEX payments_authorization_id_idx ON public.payments(authorization_id);
CREATE INDEX payments_actor_id_idx ON public.payments(actor_id);
CREATE INDEX payments_payer_participant_id_idx ON public.payments(payer_participant_id) WHERE payer_participant_id IS NOT NULL;
CREATE INDEX payments_payee_participant_id_idx ON public.payments(payee_participant_id) WHERE payee_participant_id IS NOT NULL;
CREATE INDEX payments_correlation_id_idx ON public.payments(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX payments_status_idx ON public.payments(status);

INSERT INTO public.zalagren_schema_migrations(id)
VALUES ('payments-physical-canonicalization-2026-10-02');

COMMIT;