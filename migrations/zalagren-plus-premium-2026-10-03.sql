-- Zalagren subscription tiers and entitlements — 2026-10-03
-- Production schema is applied separately through the Neon migration workflow.

CREATE TABLE IF NOT EXISTS public.zalagren_plan_features (
  id text PRIMARY KEY,
  plan_id text NOT NULL REFERENCES public.zalagren_plan_catalog(id) ON DELETE CASCADE,
  feature_code text NOT NULL,
  feature_name text NOT NULL,
  feature_description text NOT NULL,
  included boolean NOT NULL DEFAULT true,
  limit_value integer,
  UNIQUE(plan_id,feature_code)
);

INSERT INTO public.zalagren_plan_catalog (id,code,name,description,currency,amount_minor,interval_unit,interval_count,active)
VALUES
('plan-plus','plus','Zalagren Plus','Expanded daily-life coordination, stronger participant controls and priority Zalagren support.','KES',49900,'month',1,true),
('plan-premium','premium','Zalagren Premium','Advanced participant coordination, priority orchestration and premium privacy and account controls.','KES',99900,'month',1,true)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, description=EXCLUDED.description, currency=EXCLUDED.currency,
  amount_minor=EXCLUDED.amount_minor, interval_unit=EXCLUDED.interval_unit,
  interval_count=EXCLUDED.interval_count, active=true;

INSERT INTO public.zalagren_plan_features
(id,plan_id,feature_code,feature_name,feature_description,included,limit_value)
VALUES
('feature-free-identity','plan-free','identity','Persistent participant identity','Your canonical Zalagren participant account and profile.',true,NULL),
('feature-free-community','plan-free','community','Community participation','Join communities and establish participation context.',true,NULL),
('feature-free-services','plan-free','services','Essential services','Access Zalagren services according to authorization and availability.',true,NULL),
('feature-plus-profile','plan-plus','profile_controls','Expanded profile controls','More participant profile and preference controls.',true,NULL),
('feature-plus-daily','plan-plus','daily_coordination','Daily-life coordination','Coordinate more daily needs, requests and service actions from one participant account.',true,NULL),
('feature-plus-priority','plan-plus','priority_support','Priority participant support','Priority handling for Zalagren participant support workflows.',true,NULL),
('feature-plus-privacy','plan-plus','privacy_controls','Expanded privacy controls','Additional participant privacy and sharing controls as available in Zalagren.',true,NULL),
('feature-premium-intelligence','plan-premium','advanced_intelligence','Advanced GENESIS coordination','Advanced contextual proposals and coordination features when enabled for the participant.',true,NULL),
('feature-premium-orchestration','plan-premium','priority_orchestration','Priority service orchestration','Priority handling for eligible Zalagren service coordination workflows.',true,NULL),
('feature-premium-security','plan-premium','advanced_security','Advanced account controls','Expanded security, recovery and authorization controls as available.',true,NULL),
('feature-premium-privacy','plan-premium','premium_privacy','Premium privacy controls','Expanded privacy, sharing and consent-management controls.',true,NULL),
('feature-premium-support','plan-premium','premium_support','Premium participant support','Premium support handling for eligible participant issues.',true,NULL)
ON CONFLICT (plan_id,feature_code) DO UPDATE SET
  feature_name=EXCLUDED.feature_name, feature_description=EXCLUDED.feature_description,
  included=EXCLUDED.included, limit_value=EXCLUDED.limit_value;
