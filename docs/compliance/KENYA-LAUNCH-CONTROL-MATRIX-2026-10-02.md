# Kenya Launch Control Matrix — Zalagren — 2026-10-02

Status: engineering control matrix; not a legal certification.

## Data protection

Framework: Data Protection Act 2019; Data Protection Regulations 2021; ODPC guidance.

Required controls:
- controller/processor role mapping;
- registration assessment;
- DPO assessment;
- privacy notice/version;
- purpose/lawful-basis records;
- minimisation;
- access/correction/objection/deletion workflows;
- retention schedules;
- breach workflow;
- DPIA workflow for high-risk processing;
- cross-border transfer assessment;
- processor/data-sharing records;
- audit evidence.

Sensitive classes include identity documents, biometrics, health data, precise location and financial information.

## Identity

Separate:
- authentication;
- legal identity;
- document submission;
- verification;
- Zalagren-issued identity;
- community participation;
- authority.

No document number is itself proof of verification.

## Payments

Current Kenyan payment oversight is under the National Payment System Act 2011 and Regulations 2014. The 2026 National Payment System Bill is presently a draft and must not be treated as enacted law.

Zalagren therefore remains provider-neutral:
payment intent → authorization → licensed/external provider → provider result → reconciliation → evidence.

No Zalagren wallet, deposit-taking, remittance, PSP or credit claim is implied by the coordination layer.

## Tax

KRA states that persons engaged in business must onboard eTIMS and issue electronic tax invoices, subject to the applicable rules and small-business buyer-initiated invoicing mechanism.

Marketplace provider records therefore need:
- tax profile;
- KRA/eTIMS state;
- invoice evidence;
- jurisdiction;
- tax responsibility;
- transaction linkage.

Never display “eTIMS verified” without actual evidence.

## Accommodation / BnB

Tourism Regulatory Authority regulates tourism enterprises under the Tourism Act framework. TRA's current Class A licensing information includes hotels, villas, serviced apartments/short-term rentals, guest houses and homestays.

Accommodation provider state must therefore separate:
- host identity;
- ownership/occupancy relationship;
- business registration;
- KRA PIN/tax state;
- TRA licence evidence where applicable;
- inspection/quality evidence where applicable;
- insurance/evidence where applicable;
- property/place relationship;
- reservation state.

Zalagren is a coordination/marketplace layer and does not grant a tourism licence.

## Food

Food services require a separate food/public-health compliance state. A BeatFood merchant being created in Zalagren is not evidence that the business holds every applicable permit or health clearance.

## Mobility

BeatRide must separate:
- rider;
- driver/provider;
- vehicle;
- licence/permit evidence;
- insurance evidence;
- provider availability;
- trip request;
- dispatch;
- completion;
- incident/complaint;
- payment evidence.

Zalagren does not grant a transport licence.

## Health

BeatHealth is a protected domain. Health data, clinical roles, consent/confidentiality, provider credentials and regulated interoperability must not be handled as generic Marketplace data.

## Consumer protection

Marketplace must expose meaningful offer information, pricing basis, terms, availability and complaint/dispute path. Ranking or provider treatment must not become hidden discriminatory logic.

## Cybersecurity

Controls:
- least privilege;
- secure sessions;
- authorization checks;
- input validation;
- rate limiting;
- audit evidence;
- incident response;
- integrity protection;
- secure credentials;
- controlled administrative access.

## Cross-border Kenya → DRC

Cross-border personal-data movement must be explicitly classified and governed. Kenya residency and transfer safeguards must be represented before production data is replicated or disclosed to DRC infrastructure.

## Children

Minor participation must use age/guardian/purpose-sensitive controls where applicable. Adult authority must not be inferred from account existence.

## Electronic records

Terms, privacy notices, agreements and important acceptance decisions require versioned records and evidence of acceptance.

## Release states

🟢 VERIFIED = evidence checked/current.
🟡 SUPPORTED = implementation exists but external proof is pending.
🔵 PROPOSED = design/contract exists but implementation is not proven.
🔴 FAILED = control/evidence missing.

A launch checklist is not evidence of compliance; it is a control for proving the required evidence.
