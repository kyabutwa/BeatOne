import { createEvent, type Action, type Event, type Id, type LifecycleState } from "./beatcore.js";

/**
 * Canonical Event foundation entry point.
 *
 * BeatCore.createEvent remains the single semantic implementation.
 * This boundary exists so Event producers do not invent parallel Event rules.
 */
export function createCanonicalEvent(input: {
  readonly id: Id;
  readonly action: Action;
  readonly type: string;
  readonly occurredAt: string;
  readonly state: LifecycleState;
  readonly source: string;
  readonly actorId?: Id;
  readonly contextId?: Id;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly version?: number;
}): Event {
  return createEvent(input);
}
