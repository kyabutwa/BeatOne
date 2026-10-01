export type Id = string & { readonly __brand: "BeatOneId" };
export type EntityType =
  | "person" | "community" | "identity" | "participant" | "access"
  | "place" | "building" | "floor" | "unit" | "resource"
  | "relationship" | "context" | "capability" | "authorization"
  | "intent" | "proposal" | "action" | "event" | "evidence";

export type AuthorizationDecision = "ALLOW" | "DENY" | "CONDITIONAL";
export type LifecycleState =
  | "REQUESTED" | "AUTHORIZED" | "PROCESSING" | "COMPLETED"
  | "DENIED" | "REJECTED" | "FAILED" | "EXPIRED" | "CANCELLED"
  | "PARTIAL" | "DISPUTED" | "REVERSED" | "RECONCILED";

export type FailureCode =
  | "INVALID_INPUT" | "UNAUTHENTICATED" | "UNAUTHORIZED" | "NOT_FOUND"
  | "CONFLICT" | "EXPIRED" | "UNAVAILABLE" | "TIMEOUT"
  | "DEPENDENCY_FAILURE" | "VALIDATION_FAILURE" | "INTERNAL_FAILURE"
  | "RECONCILIATION_REQUIRED";

export function id(value: string): Id {
  if (!value.trim()) throw new Error("ID must not be empty");
  return value as Id;
}

export interface Identity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
}

export interface Participant {
  readonly id: Id;
  readonly identityId: Id;
  readonly contextId?: Id;
}

export interface Capability {
  readonly id: Id;
  readonly name: string;
}

export interface Authorization {
  readonly id: Id;
  readonly decision: AuthorizationDecision;
  readonly actorId: Id;
  readonly capabilityId: Id;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly scope?: string;
}

export interface Intent {
  readonly id: Id;
  readonly actorId: Id;
  readonly purpose: string;
}

export interface Proposal {
  readonly id: Id;
  readonly actorId: Id;
  readonly intentId: Id;
  readonly summary: string;
  readonly authorizationId?: Id;
}

export interface Action {
  readonly id: Id;
  readonly actorId: Id;
  readonly proposalId?: Id;
  readonly authorizationId: Id;
  readonly state: LifecycleState;
  readonly operation: string;
}

export interface Event {
  readonly id: Id;
  readonly actionId?: Id;
  readonly type: string;
  readonly occurredAt: string;
  readonly state: LifecycleState;
}

export interface Evidence {
  readonly id: Id;
  readonly eventId: Id;
  readonly source: string;
  readonly verification: "UNVERIFIED" | "VERIFIED" | "REJECTED";
}

export interface ExternalReference {
  readonly provider: string;
  readonly reference: string;
}

export interface Correlation {
  readonly requestId?: Id;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly actionId?: Id;
  readonly eventId?: Id;
  readonly evidenceId?: Id;
  readonly externalReference?: ExternalReference;
}

export function assertAuthorizationForAction(
  authorization: Authorization,
  now: Date = new Date()
): void {
  if (authorization.decision === "DENY") {
    throw new Error("UNAUTHORIZED");
  }

  if (authorization.decision === "CONDITIONAL") {
    throw new Error("UNAUTHORIZED");
  }

  const from = new Date(authorization.validFrom);
  if (Number.isNaN(from.getTime()) || now < from) {
    throw new Error("EXPIRED");
  }

  if (authorization.validUntil) {
    const until = new Date(authorization.validUntil);
    if (Number.isNaN(until.getTime()) || now >= until) {
      throw new Error("EXPIRED");
    }
  }
}

export function createAction(input: {
  id: Id;
  actorId: Id;
  operation: string;
  authorization: Authorization;
  proposalId?: Id;
  now?: Date;
}): Action {
  if (!input.operation.trim()) throw new Error("INVALID_INPUT");
  assertAuthorizationForAction(input.authorization, input.now);
  return {
    id: input.id,
    actorId: input.actorId,
    ...(input.proposalId ? { proposalId: input.proposalId } : {}),
    authorizationId: input.authorization.id,
    state: "AUTHORIZED",
    operation: input.operation
  };
}

export function createEvent(input: {
  id: Id;
  action: Action;
  type: string;
  occurredAt: string;
  state: LifecycleState;
}): Event {
  if (input.action.state === "FAILED" || input.action.state === "DENIED") {
    throw new Error("VALIDATION_FAILURE");
  }
  if (!input.type.trim()) throw new Error("INVALID_INPUT");
  return {
    id: input.id,
    actionId: input.action.id,
    type: input.type,
    occurredAt: input.occurredAt,
    state: input.state
  };
}

export function createEvidence(input: {
  id: Id;
  event: Event;
  source: string;
  verification?: Evidence["verification"];
}): Evidence {
  if (!input.source.trim()) throw new Error("INVALID_INPUT");
  return {
    id: input.id,
    eventId: input.event.id,
    source: input.source,
    verification: input.verification ?? "UNVERIFIED"
  };
}
