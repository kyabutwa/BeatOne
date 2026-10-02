# Zalagren Legal Identity & Verification Contract

## Canonical identity

Zalagren treats one participant as one canonical legal identity. The authentication provider account is linked to the participant foundation; the legal name is the canonical human-facing name once supplied.

The platform separates:
- authentication: email/password session
- contact verification: email and phone possession
- legal identity data: the person's declared legal identity
- document verification: proof that a document is genuine and belongs to the person

A submitted document is **not** marked verified merely because it was entered.

## Signup fields

The signup flow captures:
- legal name
- given/middle/family names when applicable
- date of birth
- sex as recorded
- nationality
- birth country and place
- residence country and address
- phone number
- email address
- identity document type
- issuing country and authority
- document/card number
- national identifier/NIN when the jurisdiction has one
- document serial number when present
- place/date of issue
- expiry date when present

The schema intentionally does not collect biometric templates, family/parent records, signatures, or government-registry data merely because a jurisdiction may hold those records. Those require a defined lawful purpose, consent/authority, retention policy, and a real verification integration.

## Security

Document identifiers are stored as:
- encrypted ciphertext for controlled recovery/use
- SHA-256 hash for exact-match lookup
- last four characters for participant-facing display

The encryption key must be supplied as a Cloudflare Worker secret:
- `IDENTITY_ENCRYPTION_KEY`
- base64 encoding of exactly 32 random bytes

Never commit this key to GitHub or place it in frontend code.

## Email

Neon Managed Better Auth is the email authentication provider. Production currently has a shared Neon email sender and OTP verification configured, but its provider-level "require verified email before sign-in" flag is not enabled.

Zalagren therefore enforces the verification boundary in the Worker:
- signup requests a verification email
- an unverified email sign-in is rejected with `EMAIL_NOT_VERIFIED`
- verification must occur through the managed auth provider before normal sign-in

## Phone

Phone verification is implemented through the provider boundary using Twilio Verify v2. The Worker requires:
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_VERIFY_SERVICE_SID`

Until those secrets are configured, phone verification remains explicitly unavailable; Zalagren never simulates an OTP.

## Verification state

Possible states are:
- pending
- verified
- rejected
- expired
- failed

A document submission creates a pending record. Only a real verification mechanism may transition it to verified.

## Privacy boundary

National identity information is highly sensitive personal data. Zalagren should collect only information necessary for a defined purpose, keep it separate from ordinary application data, restrict access, use cryptography and hashing, retain it only as long as necessary, and support data-subject access/correction/deletion processes appropriate to the applicable jurisdiction.
