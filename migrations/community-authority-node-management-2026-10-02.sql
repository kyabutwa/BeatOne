-- Zalagren community authority + node management physical contract
-- 2026-10-02
-- No community, representative, subscription, service, place, capability, or membership is fabricated by this migration.

CREATE TABLE IF NOT EXISTS public.community_representatives (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id),
  participant_id text NOT NULL REFERENCES public.participants(id),
  role text NOT NULL DEFAULT 'representative',
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'community_verification',
  verified_by_participant_id text NULL REFERENCES public.participants(id),
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, participant_id),
  CONSTRAINT community_representatives_role_check CHECK (role IN ('owner','admin','representative')),
  CONSTRAINT community_representatives_status_check CHECK (status IN ('pending','active','revoked')),
  CONSTRAINT community_representatives_active_verification_check CHECK (
    status <> 'active' OR (verified_by_participant_id IS NOT NULL AND verified_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_community_representatives_participant
  ON public.community_representatives(participant_id, status);
CREATE INDEX IF NOT EXISTS idx_community_representatives_community
  ON public.community_representatives(community_id, status);

CREATE TABLE IF NOT EXISTS public.community_service_bindings (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id),
  service_id text NOT NULL REFERENCES public.services(id),
  status text NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_participant_id text NOT NULL REFERENCES public.participants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, service_id),
  CONSTRAINT community_service_bindings_status_check CHECK (status IN ('active','disabled'))
);

CREATE INDEX IF NOT EXISTS idx_community_service_bindings_community
  ON public.community_service_bindings(community_id, status);

CREATE TABLE IF NOT EXISTS public.community_capability_bindings (
  id text PRIMARY KEY,
  community_id text NOT NULL REFERENCES public.communities(id),
  capability_id text NOT NULL REFERENCES public.capabilities(id),
  status text NOT NULL DEFAULT 'active',
  scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by_participant_id text NOT NULL REFERENCES public.participants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, capability_id),
  CONSTRAINT community_capability_bindings_status_check CHECK (status IN ('active','disabled'))
);

CREATE INDEX IF NOT EXISTS idx_community_capability_bindings_community
  ON public.community_capability_bindings(community_id, status);

CREATE INDEX IF NOT EXISTS idx_community_capability_bindings_capability
  ON public.community_capability_bindings(capability_id, status);

INSERT INTO public.zalagren_schema_migrations (migration_id, applied_at)
VALUES ('community-authority-node-management-2026-10-02', now())
ON CONFLICT (migration_id) DO NOTHING;
