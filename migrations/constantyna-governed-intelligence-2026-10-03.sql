-- CONSTANTYNA governed intelligence persistence — 2026-10-03
-- Raw participant prompts are intentionally not persisted here. Store only a hash and structured execution metadata.

CREATE TABLE IF NOT EXISTS public.constantyna_interactions (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  intent_code text NOT NULL,
  capability_code text NOT NULL,
  outcome_code text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  message_hash text NOT NULL,
  target text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS constantyna_interactions_participant_created_idx
  ON public.constantyna_interactions(participant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS constantyna_interactions_capability_idx
  ON public.constantyna_interactions(capability_code, created_at DESC);

INSERT INTO public.zalagren_plan_features
  (id, plan_id, feature_code, feature_name, feature_description, included, limit_value)
VALUES
  ('feature-free-constantyna-core','plan-free','constantyna_core','CONSTANTYNA core guidance','Explain Zalagren, discover available information, compare options, diagnose missing information and guide the participant to authorized interfaces.',true,NULL),
  ('feature-plus-constantyna-research','plan-plus','constantyna_research','CONSTANTYNA research and opportunity intelligence','Use enabled external research connectors and perform deeper opportunity scans with clear evidence boundaries.',true,NULL),
  ('feature-plus-constantyna-proposals','plan-plus','constantyna_proposals','CONSTANTYNA governed proposals','Prepare structured proposals for participant review without granting authority.',true,NULL),
  ('feature-premium-constantyna-orchestration','plan-premium','constantyna_orchestration','CONSTANTYNA orchestration','Coordinate eligible multi-step workflows after explicit confirmation and applicable authorization.',true,NULL)
ON CONFLICT (plan_id,feature_code) DO UPDATE SET
  feature_name=EXCLUDED.feature_name,
  feature_description=EXCLUDED.feature_description,
  included=EXCLUDED.included,
  limit_value=EXCLUDED.limit_value;
