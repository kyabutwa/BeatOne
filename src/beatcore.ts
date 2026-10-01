export type Id = string & { readonly __brand: "BeatOneId" };

export type EntityType =
  | "person" | "community" | "identity" | "participant" | "access"
  | "place" | "building" | "floor" | "unit" | "resource"
  | "relationship" | "context" | "capability" | "authorization"
  | "intent" | "proposal" | "action" | "event" | "evidence"
  | "account" | "credential" | "session";

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

export type VerificationState = "UNVERIFIED" | "VERIFIED" | "REJECTED";

export function id(value: string): Id {
  if (!value.trim()) throw new Error("ID must not be empty");
  return value as Id;
}

function requiredText(value: string, code = "INVALID_INPUT"): void {
  if (!value.trim()) throw new Error(code);
}

function parseTime(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_INPUT");
  return parsed;
}

export interface Person {
  readonly id: Id;
}

export interface Community {
  readonly id: Id;
  readonly name: string;
}

export interface Identity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
  readonly personId?: Id;
}

export interface Account {
  readonly id: Id;
  readonly identityId: Id;
  readonly status: "ACTIVE" | "SUSPENDED" | "CLOSED";
}

export interface Credential {
  readonly id: Id;
  readonly accountId: Id;
  readonly kind: string;
  readonly status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface Session {
  readonly id: Id;
  readonly accountId: Id;
  readonly authenticatedAt: string;
  readonly expiresAt: string;
}

export interface Participant {
  readonly id: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}

export interface Access {
  readonly id: Id;
  readonly participantId: Id;
  readonly targetType:
    | "place"
    | "building"
    | "floor"
    | "unit"
    | "resource"
    | "service"
    | "digital";
  readonly targetId: Id;
  readonly mode:
    | "physical"
    | "digital"
    | "service"
    | "resource"
    | "contextual"
    | "temporary"
    | "delegated";
}

export interface Place {
  readonly id: Id;
  readonly kind: "PLACE" | "BUILDING" | "FLOOR" | "UNIT" | "RESOURCE";
  readonly parentId?: Id;
}

export interface Context {
  readonly id: Id;
  readonly participantId: Id;
  readonly placeId?: Id;
  readonly communityId?: Id;
  readonly purpose?: string;
}

export interface Relationship {
  readonly id: Id;
  readonly subjectId: Id;
  readonly targetId: Id;
  readonly kind: string;
  readonly validFrom: string;
  readonly validUntil?: string;
}

export interface Capability {
  readonly id: Id;
  readonly name: string;
}

export interface Authorization {
  readonly id: Id;
  readonly decision: AuthorizationDecision;
  readonly actorId: Id;
  readonly participantId?: Id;
  readonly contextId?: Id;
  readonly relationshipId?: Id;
  readonly capabilityId: Id;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly scope?: string;
  readonly delegatedBy?: Id;
}

export interface Intent {
  readonly id: Id;
  readonly actorId: Id;
  readonly purpose: string;
  readonly contextId?: Id;
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
  readonly contextId?: Id;
  readonly correlationId?: Id;
  readonly idempotencyKey?: string;
}

export interface Event {
  readonly id: Id;
  readonly actionId?: Id;
  readonly type: string;
  readonly occurredAt: string;
  readonly state: LifecycleState;
  readonly actorId?: Id;
  readonly contextId?: Id;
  readonly source: string;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly version: number;
}

export interface Evidence {
  readonly id: Id;
  readonly eventId?: Id;
  readonly source: string;
  readonly verification: VerificationState;
  readonly recordedAt: string;
  readonly externalReference?: ExternalReference;
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
  if (authorization.decision !== "ALLOW") throw new Error("UNAUTHORIZED");

  const from = parseTime(authorization.validFrom);
  if (now < from) throw new Error("EXPIRED");

  if (authorization.validUntil) {
    const until = parseTime(authorization.validUntil);
    if (now >= until) throw new Error("EXPIRED");
  }
}

export function assertActionTransition(
  from: LifecycleState,
  to: LifecycleState
): void {
  const allowed: Record<LifecycleState, LifecycleState[]> = {
    REQUESTED: ["AUTHORIZED", "DENIED", "REJECTED", "CANCELLED", "EXPIRED"],
    AUTHORIZED: ["PROCESSING", "DENIED", "CANCELLED", "EXPIRED", "FAILED"],
    PROCESSING: ["COMPLETED", "FAILED", "PARTIAL", "DISPUTED", "CANCELLED"],
    COMPLETED: ["REVERSED", "DISPUTED", "RECONCILED"],
    DENIED: [],
    REJECTED: [],
    FAILED: ["RECONCILED"],
    EXPIRED: [],
    CANCELLED: [],
    PARTIAL: ["COMPLETED", "FAILED", "DISPUTED", "RECONCILED"],
    DISPUTED: ["RECONCILED", "REVERSED"],
    REVERSED: ["RECONCILED"],
    RECONCILED: []
  };
  if (!allowed[from].includes(to)) throw new Error("VALIDATION_FAILURE");
}

export function createAction(input: {
  id: Id;
  actorId: Id;
  operation: string;
  authorization: Authorization;
  proposalId?: Id;
  contextId?: Id;
  correlationId?: Id;
  idempotencyKey?: string;
  now?: Date;
}): Action {
  requiredText(input.operation);
  assertAuthorizationForAction(input.authorization, input.now);
  if (input.actorId !== input.authorization.actorId) throw new Error("UNAUTHORIZED");
  return {
    id: input.id,
    actorId: input.actorId,
    ...(input.proposalId ? { proposalId: input.proposalId } : {}),
    authorizationId: input.authorization.id,
    state: "AUTHORIZED",
    operation: input.operation,
    ...(input.contextId ? { contextId: input.contextId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {})
  };
}

export function createEvent(input: {
  id: Id;
  action: Action;
  type: string;
  occurredAt: string;
  state: LifecycleState;
  source: string;
  actorId?: Id;
  contextId?: Id;
  correlationId?: Id;
  causationId?: Id;
  version?: number;
}): Event {
  if (input.action.state === "FAILED" || input.action.state === "DENIED") {
    throw new Error("VALIDATION_FAILURE");
  }
  requiredText(input.type);
  requiredText(input.source);
  if (input.state === "FAILED" || input.state === "DENIED") {
    throw new Error("VALIDATION_FAILURE");
  }
  return {
    id: input.id,
    actionId: input.action.id,
    type: input.type,
    occurredAt: parseTime(input.occurredAt).toISOString(),
    state: input.state,
    source: input.source,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.contextId ? { contextId: input.contextId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    ...(input.causationId ? { causationId: input.causationId } : {}),
    version: input.version ?? 1
  };
}

export function createEvidence(input: {
  id: Id;
  event?: Event;
  source: string;
  recordedAt?: string;
  verification?: VerificationState;
  externalReference?: ExternalReference;
}): Evidence {
  requiredText(input.source);
  if (input.externalReference) {
    requiredText(input.externalReference.provider);
    requiredText(input.externalReference.reference);
  }
  return {
    id: input.id,
    ...(input.event ? { eventId: input.event.id } : {}),
    source: input.source,
    verification: input.verification ?? "UNVERIFIED",
    recordedAt: parseTime(input.recordedAt ?? new Date().toISOString()).toISOString(),
    ...(input.externalReference ? { externalReference: input.externalReference } : {})
  };
}
