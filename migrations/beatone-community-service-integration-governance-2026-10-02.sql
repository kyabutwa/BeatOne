-- BeatOne service ownership / community integration governance reconciliation
-- 2026-10-02
-- Communities coordinate node-level integration. They do not own or disable BeatOne services.

UPDATE public.community_service_bindings
SET status='active', updated_at=now()
WHERE status='disabled';

ALTER TABLE public.community_service_bindings
  DROP CONSTRAINT IF EXISTS community_service_bindings_status_check;

ALTER TABLE public.community_service_bindings
  ADD CONSTRAINT community_service_bindings_status_check
  CHECK (status = 'active');

INSERT INTO public.zalagren_schema_migrations (migration_id, applied_at)
VALUES ('beatone-community-service-integration-governance-2026-10-02', now())
ON CONFLICT (migration_id) DO NOTHING;
