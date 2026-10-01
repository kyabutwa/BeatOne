import { createEvidence, type Evidence, type Event, type ExternalReference, type Id, type VerificationState } from "./beatcore.js";

/**
 * Canonical Evidence foundation boundary.
 * BeatCore.createEvidence remains the single semantic implementation.
 */
export function createCanonicalEvidence(input: {
  readonly id: Id;
  readonly event?: Event;
  readonly source: string;
  readonly recordedAt?: string;
  readonly verification?: VerificationState;
  readonly externalReference?: ExternalReference;
}): Evidence {
  return createEvidence(input);
}
