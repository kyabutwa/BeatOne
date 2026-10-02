# BeatOne Canonical Account, Verification and Device Protocol — 2026-10-02

**Status:** 🟡 SUPPORTED — canonical contract implemented in repository; production migration remains a separate approval gate.

This is the foundational authentication/account reconciliation for BeatOne. It is inspired by publicly documented Apple platform patterns, not an implementation copy of Apple or iCloud.

## 1. Architectural principle

BeatOne must behave as one account system, not a collection of screens and provider calls.

`Account` is the durable cloud root.
`Identity` describes the person/entity.
`Participant` represents that identity in BeatOne's ecosystem.
`Credential` represents an account-owned authentication credential.
`Session` represents an authenticated runtime session.
`Device` represents a client instance that may become trusted.
`Verification Challenge` represents one server-side verification transaction.

Provider infrastructure remains separate and authoritative for provider execution.

## 2. Canonical lifecycle

Account creation
→ Identity/Participant binding
→ Contact registered
→ One verification challenge issued
→ Provider delivers code
→ User enters code
→ Same challenge is verified
→ Contact becomes verified
→ Account can establish an authenticated session
→ Optional device enrollment/trust
→ Legal identity can be submitted
→ External/authorized identity verification can produce evidence
→ Contextual authorization is granted separately.

No step silently grants the authority of a later step.

## 3. OTP architecture

BeatOne never stores the OTP itself.

For every send/resend:
1. supersede the previous pending BeatOne challenge for the same account/channel/target;
2. create exactly one `verification_challenges` row;
3. call the provider;
4. retain only provider reference and provider outcome;
5. verify against the provider using the same normalized target;
6. mark that exact BeatOne challenge VERIFIED/FAILED/EXPIRED.

This prevents UI state from becoming the source of truth and prevents duplicate sends from creating ambiguous active codes.

Neon Auth remains authoritative for email OTP verification. Twilio Verify remains authoritative for SMS verification.

## 4. Account/device model

A device is not an identity and is not automatically authoritative.

A future native client may bind a device key/public-key credential to `account_devices`. The server stores a hash/fingerprint and lifecycle state rather than a device passcode or OTP.

Supported device states:
- PENDING
- ACTIVE
- REVOKED

A trusted device can later participate in passkey/biometric/local-auth flows without turning biometrics into BeatOne's legal identity verification.

## 5. Apple/iCloud-inspired design rules

Public Apple guidance emphasizes minimizing account data, identifying the current authentication method, using passkeys/system authentication where possible, and using secure keychain facilities rather than inventing custom authentication schemes. Apple also documents iCloud Keychain as a cloud synchronization/recovery architecture in which sensitive credentials are protected from the cloud service itself.

BeatOne therefore adopts the architectural ideas, not Apple's proprietary implementation:
- account as the durable cloud identity;
- explicit device/session relationships;
- verification as a transaction, not a UI flag;
- credentials separate from legal identity;
- local/device authentication separate from server authorization;
- provider authority remains explicit;
- sensitive secrets are not copied into BeatOne's database;
- recovery is a separate controlled protocol.

## 6. Non-negotiable boundaries

Authentication ≠ contact verification.
Contact verification ≠ legal identity verification.
Legal identity verification ≠ community participation.
Participation ≠ authorization.
Authorization ≠ provider execution.
GENESIS never creates authority.

**No Authorization → No Consequential Action.**

## 7. Current implementation

Repository:
- `src/beatone-verification.ts`
- `migrations/beatone-account-verification-device-protocol-2026-10-02.sql`

The migration creates:
- `public.verification_challenges`
- `public.account_devices`

Neither table stores OTP values.

Production application of the migration is intentionally separate from repository implementation and requires the existing production-change gate.
