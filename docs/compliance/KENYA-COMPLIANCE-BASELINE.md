# Kenya Compliance Architecture Baseline

Date: 2026-10-02
Status: Architectural baseline — not a legal certification.

Zalagren must encode regulatory boundaries as product and technical controls. A law cannot be satisfied merely by adding a label to the UI.

## Data protection
Primary framework:
- Data Protection Act, 2019.
- Data Protection (General) Regulations, 2021.
- Data Protection (Registration of Data Controllers and Data Processors) Regulations, 2021.
- Data Protection (Complaints Handling and Enforcement Procedures) Regulations, 2021.

Controls:
- purpose-bound processing;
- data minimisation;
- contextual access;
- consent/legal-basis records where applicable;
- data-subject request workflows;
- retention/deletion;
- controller/processor records;
- breach handling;
- DPIA workflow for high-risk processing;
- cross-border transfer assessment;
- audit evidence.

Biometric data, health data, precise location and financial information require heightened handling.

## Cybersecurity and electronic transactions
Relevant framework includes the Computer Misuse and Cybercrimes Act, 2018 and electronic-transactions provisions of the Kenya Information and Communications Act.

Controls:
- secure authentication;
- session lifecycle;
- authorization separate from authentication;
- input validation;
- rate limiting;
- audit logging;
- incident response;
- secure evidence;
- integrity protection;
- electronic-record traceability.

## Payments and financial activity
Relevant framework includes the National Payment System Act and Regulations, CBK payment-service-provider oversight, AML/CFT/CPF requirements, and applicable digital-credit rules where credit is introduced.

Boundary:
Zalagren coordinates payment intent, authorization, provider execution, reconciliation and evidence. It must not silently become a deposit-taking institution, issuer, PSP, lender, remittance provider or other regulated financial institution.

Provider adapters must record provider, transaction/reference ID, amount/currency, authorization basis, provider status, final outcome, webhook/evidence and reconciliation state.

## Insurance
Insurance capabilities must respect the Insurance Act and Insurance Regulatory Authority licensing framework.

Boundary:
Zalagren can provide discovery, comparison, contextual coordination and referral. Regulated insurance intermediation or underwriting must be performed by appropriately licensed actors and integrations.

## Mobility
Ride and public-transport capabilities must respect NTSA and applicable PSV/road-safety requirements.

Controls:
- operator identity;
- driver identity/verification;
- vehicle identity;
- licence/permit evidence;
- safety status;
- trip lifecycle;
- pickup/drop-off context;
- incident reporting;
- complaints;
- fare/receipt evidence.

Zalagren does not grant regulatory licences.

## Food and commerce
Food and commerce must account for food-safety/public-health requirements, consumer protection and fair/deceptive-practice rules.

BeatFood lifecycle:
catalogue/listing -> order intent -> merchant acceptance -> preparation -> dispatch -> delivery -> completion -> payment/reconciliation.

## BeatHealth
BeatHealth is not a generic marketplace when it handles health data or clinical workflows.

Controls:
- health-data classification;
- expressly authorized access;
- clinical-role separation;
- consent and confidentiality;
- immutable audit trail;
- health-record lifecycle;
- provider credential/evidence state;
- referral boundary;
- regulated digital-health interoperability where applicable.

Clinical diagnosis, treatment, prescribing and other regulated activities remain bounded to appropriately authorized providers/systems.

## Competition and marketplace fairness
Marketplace architecture must avoid hidden discriminatory ranking, deceptive pricing and opaque provider treatment.

Provider participation should expose identity, category, service area, capability, verification state, pricing basis where applicable, availability, terms and complaints/dispute path.

## Business and tax boundary
Support legal-entity identity, registration evidence, beneficial-ownership/KYB where required, invoices/receipts, transaction records and tax-relevant evidence.

## Compliance state model
VERIFIED = evidence checked and current.
SUPPORTED = architecture supports the requirement but external evidence is still required.
PROPOSED = design exists but implementation is not proven.
FAILED = control or evidence is missing.

The platform must never convert PROPOSED or SUPPORTED into VERIFIED through UI wording alone.
