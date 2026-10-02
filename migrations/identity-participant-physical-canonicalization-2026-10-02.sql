BEGIN;

-- Zero-data invariant:
-- adding these required canonical columns without defaults intentionally fails
-- if identities or participants contain rows. PostgreSQL transaction rollback
-- then preserves the pre-migration schema.

ALTER TABLE public.identities
  DROP CONSTRAINT IF EXISTS identities_participant_id_fkey,
  DROP COLUMN IF EXISTS participant_id,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.identities
  ADD COLUMN kind text NOT NULL,
  ADD COLUMN person_id text;

ALTER TABLE public.identities
  ADD CONSTRAINT identities_kind_check
  CHECK (kind IN ('human','organization','service','system'));

ALTER TABLE public.participants
  DROP COLUMN IF EXISTS display_name,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS created_at;

ALTER TABLE public.participants
  ADD COLUMN identity_id text NOT NULL,
  ADD COLUMN community_id text,
  ADD COLUMN context_id text;

ALTER TABLE public.participants
  ADD CONSTRAINT participants_identity_id_fkey
  FOREIGN KEY (identity_id) REFERENCES public.identities(id);

ALTER TABLE public.participants
  ADD CONSTRAINT participants_community_id_fkey
  FOREIGN KEY (community_id) REFERENCES public.communities(id);

ALTER TABLE public.participants
  ADD CONSTRAINT participants_context_id_fkey
  FOREIGN KEY (context_id) REFERENCES public.contexts(id);

CREATE INDEX IF NOT EXISTS idx_participants_identity_id
  ON public.participants(identity_id);

CREATE INDEX IF NOT EXISTS idx_participants_community_id
  ON public.participants(community_id);

CREATE INDEX IF NOT EXISTS idx_participants_context_id
  ON public.participants(context_id);

COMMIT;
