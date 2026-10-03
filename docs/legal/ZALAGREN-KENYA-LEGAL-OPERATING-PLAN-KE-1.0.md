# Zalagren Kenya Legal & Regulatory Operating Plan
Version: KE-1.0
Effective: 3 October 2026
Status: implementation baseline; external Kenyan legal/compliance review remains required before commercial launch.

## 1. Operating boundary
Zalagren is a coordination and participation platform. It must not represent itself as a bank, payment service provider, telecommunications operator, insurer, hospital, pharmacy, licensed transport operator, regulated health provider, or government identity authority unless the relevant licence, registration, contract or delegated authority actually exists.

## 2. Data protection
Zalagren will apply data minimisation, purpose limitation, lawful/fair/transparent processing, retention controls, access control, security safeguards, correction/export/request workflows, incident response and documented processor/controller roles. Sensitive domains (health, biometrics, precise location, legal identity and financial/payment information) require explicit purpose and access boundaries.

Before Kenyan commercial processing, the legal entity must determine its ODPC controller/processor registration obligations and complete applicable registration. Third-party processors must be governed by written data-processing terms.

## 3. Participant rights
The product must expose privacy notice, purposes, recipients, retention approach, contact route, correction request, access/export request and applicable objection/deletion/restriction workflows. Identity verification evidence must never be reused for unrelated purposes without a lawful basis and appropriate notice.

## 4. Payments
BeatPay/Zalagren Payments is a coordination layer. M-PESA/Daraja remains the payment rail. Zalagren must not hold customer funds, issue stored value, provide remittance, or perform other regulated payment services without the required Kenyan authorisation/partner structure.

Live M-PESA requires a Safaricom Daraja application, production credentials, appropriate PayBill/Till/B2C arrangement and callback configuration. Sandbox and production must be separated. Payment state must be driven by provider callbacks/reconciliation, not by the browser.

## 5. Subscriptions
Plans are transparent, cancellable and non-deceptive. Free participation remains available. Paid plans clearly disclose price, billing interval, included capabilities, taxes/fees where applicable, activation state, cancellation and refund/support route. A failed payment must not silently create an active paid entitlement.

## 6. Consumer protection
Zalagren must publish clear terms, service descriptions, material limitations, provider identity where relevant, complaint/support route, cancellation/refund rules and records of material consent/acceptance.

## 7. Health
BeatHealth is a protected domain. Clinical decisions remain with qualified providers. Health data is segregated by purpose and authorisation. Zalagren does not present itself as a clinical authority merely because it coordinates appointments, providers, medicines or delivery.

## 8. Transport
BeatRide may provide first-party software and dispatch coordination, but driver, vehicle, insurance, licensing and safety evidence must be verified according to applicable Kenyan transport requirements before operational launch.

## 9. Commerce and delivery
BeatFood/BeatMarket providers remain responsible for their regulated goods/services. Medicines, food, transport, courier and other regulated activities must use appropriate licensed providers and verification boundaries.

## 10. Governance
Every regulated capability has a compliance state:
- VERIFIED: evidence checked and current.
- SUPPORTED: architecture exists but external provider/legal evidence remains.
- PROPOSED: designed but not operational.
- FAILED: blocked or non-compliant.

No UI may display VERIFIED when only a database record or mock integration exists.

## 11. Security baseline
Production secrets stay in Cloudflare secrets/environment configuration. No API credentials, M-PESA passkeys or identity evidence belong in source control. Payment callbacks are server-to-server. Authentication and authorization remain separate. Administrative actions require least privilege and auditable events.

## 12. Required launch gates
1. Kenyan legal entity and commercial contracting structure confirmed.
2. ODPC obligations assessed and applicable registration completed.
3. Privacy notice, terms, consumer policy and data-processing agreements approved.
4. M-PESA/Safaricom production onboarding completed before live payment collection.
5. Health/transport/medicine/courier partners verified where regulated.
6. Tax/accounting treatment confirmed by the business's Kenyan tax adviser.
7. Incident response, complaints, refunds and data-subject request processes tested.
8. Production security review completed.
