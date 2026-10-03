-- Zalagren service catalog foundation
-- Services are Zalagren coordination capabilities, not claims of provider connectivity.
BEGIN;

INSERT INTO public.services (id,name,domain,status) VALUES
('service-beatpay','BeatPay','payments','available'),
('service-beatride','BeatRide','mobility','available'),
('service-beatfood','BeatFood','food','available'),
('service-beathealth','BeatHealth','health','available'),
('service-beatmarket','BeatMarket','commerce','available'),
('service-beatgenzi','BeatGenzi','discovery','available'),
('service-beatguardian','BeatGuardian','trust','available'),
('service-beatutilities','BeatUtilities','utilities','available')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, domain=EXCLUDED.domain, status=EXCLUDED.status;

INSERT INTO public.capabilities (id,service_id,name,action,allowed_roles,requires_explicit_authorization,resource_type,scope) VALUES
('cap-beatpay-intent','service-beatpay','Create payment intent','payment.intent.create','["participant","merchant","operator"]'::jsonb,true,'payment','["participant","community"]'::jsonb),
('cap-beatpay-status','service-beatpay','View payment status','payment.status.read','["participant","merchant","operator"]'::jsonb,true,'payment','["participant","community"]'::jsonb),
('cap-beatride-request','service-beatride','Request ride','ride.request.create','["participant","rider"]'::jsonb,true,'ride','["participant","community"]'::jsonb),
('cap-beatride-status','service-beatride','View ride status','ride.status.read','["participant","rider"]'::jsonb,true,'ride','["participant","community"]'::jsonb),
('cap-beatfood-order','service-beatfood','Create food order','food.order.create','["participant","customer"]'::jsonb,true,'food_order','["participant","community"]'::jsonb),
('cap-beatfood-status','service-beatfood','View food order','food.order.read','["participant","customer","merchant"]'::jsonb,true,'food_order','["participant","community"]'::jsonb),
('cap-beathealth-request','service-beathealth','Request health coordination','health.request.create','["participant","patient"]'::jsonb,true,'health_case','["participant"]'::jsonb),
('cap-beathealth-status','service-beathealth','View health coordination status','health.status.read','["participant","patient"]'::jsonb,true,'health_case','["participant"]'::jsonb),
('cap-beatmarket-offer','service-beatmarket','Create marketplace offer','market.offer.create','["participant","seller"]'::jsonb,true,'offer','["participant","community"]'::jsonb),
('cap-beatmarket-order','service-beatmarket','Create marketplace order','market.order.create','["participant","buyer"]'::jsonb,true,'order','["participant","community"]'::jsonb),
('cap-beatgenzi-discover','service-beatgenzi','Create discovery intent','discovery.intent.create','["participant"]'::jsonb,true,'discovery','["participant","community"]'::jsonb),
('cap-beatgenzi-view','service-beatgenzi','View discovery results','discovery.result.read','["participant"]'::jsonb,true,'discovery','["participant","community"]'::jsonb),
('cap-beatguardian-access','service-beatguardian','Request protected access','guardian.access.request','["participant","visitor","host"]'::jsonb,true,'access','["participant","community","place"]'::jsonb),
('cap-beatguardian-review','service-beatguardian','Review access event','guardian.access.read','["participant","host","security"]'::jsonb,true,'access','["community","place"]'::jsonb),
('cap-beatutilities-status','service-beatutilities','View utility status','utility.status.read','["participant","resident","operator"]'::jsonb,true,'utility','["participant","community","place"]'::jsonb),
('cap-beatutilities-request','service-beatutilities','Submit utility request','utility.request.create','["participant","resident"]'::jsonb,true,'utility','["participant","community","place"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
 service_id=EXCLUDED.service_id,name=EXCLUDED.name,action=EXCLUDED.action,allowed_roles=EXCLUDED.allowed_roles,
 requires_explicit_authorization=EXCLUDED.requires_explicit_authorization,resource_type=EXCLUDED.resource_type,scope=EXCLUDED.scope;

INSERT INTO public.zalagren_schema_migrations(id)
VALUES ('zalagren-service-catalog-2026-10-03')
ON CONFLICT (id) DO NOTHING;

COMMIT;
