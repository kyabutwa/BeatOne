# BeatOne Account, Security and Identity Review — 2026-10-02

## Purpose

This review reconciles the current BeatOne implementation against the full intelligent-living infrastructure vision and against publicly documented account-security patterns from Upwork and Exness.

The reference products are used for architectural learning only. BeatOne does not copy proprietary source code, private implementation details, branding, or undocumented behavior.

## Canonical BeatOne model

BeatOne is one ecosystem, not a set of disconnected apps.

The canonical chain remains:

`Jurisdiction → Identity → Participant → Legal/Regulatory Status → Community → Place → Relationship → Capability → Authorization → Intent → Proposal → Action → Event → Evidence → Knowledge → GENESIS proposal`

Account security is an adjacent control plane:

`Account → Authentication Method → Session → Device → Contact Verification → Legal Identity Evidence → Assurance Level → Contextual Authorization → Consequential Action → Event/Evidence`

These chains meet at Participant and Authorization. Authentication never becomes authorization by implication.

## What the public Upwork model teaches

Upwork publicly documents:
- password-based account access plus configurable two-step verification;
- multiple second-factor methods, including mobile prompt, SMS, authenticator code and a security question;
- conditional identity verification rather than treating every login as a KYC event;
- government ID verification;
- conditional phone, location and visual verification;
- an account settings area where verification progress can be followed;
- restrictions on consequential marketplace/earnings activity when required verification is incomplete.

BeatOne therefore uses these public patterns as design principles:
1. authentication and identity verification are separate states;
2. verification requirements are capability/risk dependent;
3. a participant can see a durable verification lifecycle;
4. verification evidence is private while a public-facing state can be minimal;
5. additional verification can be requested again when risk or a regulated capability requires it.

## What the public Exness model teaches

Exness publicly documents:
- a Personal Area as the durable account-management surface;
- security types based on phone or email and, in some countries, TOTP;
- six-digit confirmation for sensitive account operations;
- identity checks for selected non-trading operations such as password/security changes and withdrawals;
- a separate identity/KYC boundary for client verification;
- a support PIN as an additional account-ownership control.

BeatOne therefore uses these public patterns as design principles:
1. ordinary navigation does not require repeating high-friction identity checks;
2. sensitive changes and consequential operations can require step-up authentication;
3. a security method is a credential/control, not legal identity;
4. recovery and support ownership are separate from normal session authentication;
5. regulated execution remains provider-authoritative.

## BeatOne implementation contract

### Account
- one durable cloud account;
- email/password remains the current primary provider-backed sign-in path;
- no duplicate local password authority;
- provider session remains authoritative for provider authentication;
- BeatOne mirrors only the minimum canonical account/identity/participant relationships needed for its ecosystem.

### Contacts
- email and phone are contacts, not legal identity;
- every verification attempt is attached to a durable challenge;
- OTP values are never stored by BeatOne;
- one current pending challenge exists per account/channel/target;
- resend supersedes the previous challenge;
- provider result and provider reference are retained as evidence;
- expiry is explicit.

### Devices
- a device is not an identity;
- a device is not automatically authoritative;
- `account_devices` is the future home for trusted-device lifecycle;
- future passkeys/device keys may bind here;
- local biometrics remain a device-local authentication mechanism and do not become government identity evidence.

### Legal identity
- legal name and identity document data are progressive-disclosure data;
- document number is encrypted and hashed where stored;
- government documents are not required merely because a participant created an account;
- verification status is separate from the document record;
- an external verifier, regulator or authorized review process may be the source of truth for a specific regulated verification;
- BeatOne records evidence and status rather than pretending to be a government identity authority.

### Assurance
BeatOne uses explicit assurance states:
- `contact_verified`
- `identity_submitted`
- `identity_pending`
- `identity_verified`
- `step_up_required`
- `context_authorized`

These states are not interchangeable.

### Consequential actions
Sensitive actions should be evaluated against:
- authenticated session;
- account status;
- participant binding;
- current device/security method where applicable;
- required contact verification;
- legal/regulatory assurance;
- contextual authorization;
- provider connection and provider-side authorization;
- event/evidence requirements.

No Authorization → No Consequential Action.

## Current corrections made in this review

1. Expired verification challenges are now explicitly transitioned to `EXPIRED` before the external provider is contacted.
2. Verification endpoints load the latest challenge first instead of filtering expired rows away and misreporting them as `NOT_FOUND`.
3. A non-active challenge cannot be verified.
4. The account protocol documentation now reflects the actual production persistence state rather than describing the migration as merely pending.
5. The architecture documentation explicitly separates contact verification, legal identity, step-up authentication, contextual authority and provider execution.
6. The Upwork/Exness review is recorded as a public-pattern reference, not a claim of proprietary equivalence.

## Items that must remain truthful

- A green repository check does not prove a live SMS/email provider call.
- Twilio trial is a testing arrangement, not a permanently free production SMS service.
- A verified phone/email does not prove government identity.
- A submitted document does not mean the document is verified.
- A verified identity does not grant community authority.
- Community coordination does not give a community ownership or shutdown control over BeatOne services.
- GENESIS can propose and explain but cannot authorize or execute.
- A provider integration is not considered live until real provider credentials, an authorized connection, successful execution and evidence are all present.

## Full-ecosystem reconciliation

The account/security plane must support the existing BeatOne domains without replacing their contracts:

- Access: identity + place + relationship + capability + authorization + event.
- Communities: participation and representative authority are explicit and separate from account ownership.
- BeatMarket/BnB: identity and verification can gate listings/reservations where policy requires, but community status is not fabricated.
- BeatPay: regulated payment rails remain authoritative; BeatOne does not become an unlicensed wallet or PSP.
- BeatRide: provider-backed execution is required before claiming transport execution.
- BeatFood: merchant, item and order lifecycle remain distinct from identity assurance.
- BeatHealth: health data stays in a sensitive boundary and is not treated as ordinary profile data.
- BeatUtilities: utility coordination remains contextual and provider-backed.
- GENESIS: intelligence remains proposal-only.
- Guardian and future services: consequential operations must pass the same authorization/evidence boundary.

## Final architectural rule

BeatOne should feel like one coherent participant account and world, while retaining strict internal boundaries:

`One account ≠ one authority`

`One identity ≠ one verification`

`One verification ≠ one permission`

`One community ≠ service ownership`

`One proposal ≠ one action`

`One provider connection ≠ fabricated execution`

The participant remains the center of the ecosystem, and authority remains explicit, contextual, revocable and evidenced.


## Revised account-entry model — 2026-10-02

The previous mandatory contact-OTP gate is no longer the BeatOne account-entry architecture.

Public patterns reviewed:
- Upwork treats password login and optional/managed two-step methods as account security, while identity verification is a separate process that can be requested when required. citeturn0search0turn0search5turn0search8
- Apple documents stronger account security such as security keys as an optional layer around the Apple Account rather than treating a security key as legal identity. citeturn0search2
- Snapchat uses additional login verification for new/unrecognized devices and supports recovery codes for 2FA; its public signup flow can use phone or email. citeturn0search7turn0search13
- Exness applies identity verification to sensitive account operations, illustrating a step-up boundary rather than making every ordinary navigation action a KYC flow. citeturn0search48

BeatOne therefore uses:

`Account credentials → provider session → canonical BeatOne session → Participant Home`

Then, only when needed:

`Step-up security → Contact assurance / authenticator / device → Legal identity evidence → Contextual authorization → Consequential action`

### Important security distinction

A user typing a phrase displayed by BeatOne can prove only that the person can read and reproduce that phrase. It is **not** proof of ownership of an email address, phone number, government identity, or account.

Therefore BeatOne must never treat a freely typed "confirmation text" as identity verification. Such a phrase may be used as a harmless onboarding acknowledgement or UI test, but never as a substitute for authentication, recovery, KYC, or authorization.

### Current account behavior

- Sign-up creates the account and session without waiting for email OTP.
- Sign-in is not blocked by an unverified email flag.
- Sign-out revokes the corresponding canonical BeatOne sessions as well as invoking provider sign-out.
- Contact verification endpoints remain available as optional assurance mechanisms.
- Legal identity verification remains the stronger, real-information verification boundary.
- Sensitive or regulated actions may require step-up assurance.
