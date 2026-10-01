import type {
  Id,
  LifecycleState,
  AuthorizationDecision,
  VerificationState
} from "./beatcore.js";

export type PersistenceTable =
  | "persons" | "communities" | "identities" | "accounts" | "credentials"
  | "sessions" | "participants" | "accesses" | "places" | "contexts" | "relationships"
  | "capabilities" | "authorizations" | "intents" | "proposals" | "actions"
  | "events" | "evidences" | "payments";

export interface PersistenceTableDefinition {
  readonly table: PersistenceTable;
  readonly owner: string;
  readonly primaryKey: "id";
}

export const persistenceTables: readonly PersistenceTableDefinition[] = [
  { table: "persons", owner: "Person", primaryKey: "id" },
  { table: "communities", owner: "Community", primaryKey: "id" },
  { table: "identities", owner: "Identity", primaryKey: "id" },
  { table: "accounts", owner: "Account", primaryKey: "id" },
  { table: "credentials", owner: "Credential", primaryKey: "id" },
  { table: "sessions", owner: "Session", primaryKey: "id" },
  { table: "participants", owner: "Participant", primaryKey: "id" },
  { table: "accesses", owner: "Access", primaryKey: "id" },
  { table: "places", owner: "Place", primaryKey: "id" },
  { table: "contexts", owner: "Context", primaryKey: "id" },
  { table: "relationships", owner: "Relationship", primaryKey: "id" },
  { table: "capabilities", owner: "Capability", primaryKey: "id" },
  { table: "authorizations", owner: "Authorization", primaryKey: "id" },
  { table: "intents", owner: "Intent", primaryKey: "id" },
  { table: "proposals", owner: "Proposal", primaryKey: "id" },
  { table: "actions", owner: "Action", primaryKey: "id" },
  { table: "events", owner: "Event", primaryKey: "id" },
  { table: "evidences", owner: "Evidence", primaryKey: "id" },
  { table: "payments", owner: "Payment", primaryKey: "id" }
];

export interface StoredPerson { readonly id: Id; }
export interface StoredCommunity { readonly id: Id; readonly name: string; }
export interface StoredIdentity {
  readonly id: Id;
  readonly kind: "human" | "organization" | "service" | "system";
  readonly personId?: Id;
}
export interface StoredAccount {
  readonly id: Id;
  readonly identityId: Id;
  readonly status: "ACTIVE" | "SUSPENDED" | "CLOSED";
}
export interface StoredCredential {
  readonly id: Id;
  readonly accountId: Id;
  readonly kind: string;
  readonly status: "ACTIVE" | "REVOKED" | "EXPIRED";
}
export interface StoredSession {
  readonly id: Id;
  readonly accountId: Id;
  readonly authenticatedAt: string;
  readonly expiresAt: string;
}
export interface StoredParticipant {
  readonly id: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}
export interface StoredAccess {
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
export interface StoredPlace {
  readonly id: Id;
  readonly kind: "PLACE" | "BUILDING" | "FLOOR" | "UNIT" | "RESOURCE";
  readonly parentId?: Id;
}
export interface StoredContext {
  readonly id: Id;
  readonly participantId: Id;
  readonly placeId?: Id;
  readonly communityId?: Id;
  readonly purpose?: string;
}
export interface StoredRelationship {
  readonly id: Id;
  readonly subjectId: Id;
  readonly targetId: Id;
  readonly kind: string;
  readonly validFrom: string;
  readonly validUntil?: string;
}
export interface StoredCapability { readonly id: Id; readonly name: string; }
export interface StoredAuthorization {
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
export interface StoredIntent {
  readonly id: Id;
  readonly actorId: Id;
  readonly purpose: string;
  readonly contextId?: Id;
}
export interface StoredProposal {
  readonly id: Id;
  readonly actorId: Id;
  readonly intentId: Id;
  readonly summary: string;
  readonly authorizationId?: Id;
}
export interface StoredAction {
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
export interface StoredEvent {
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
export interface StoredEvidence {
  readonly id: Id;
  readonly eventId?: Id;
  readonly source: string;
  readonly verification: VerificationState;
  readonly recordedAt: string;
  readonly externalProvider?: string;
  readonly externalReference?: string;
}
export type StoredPaymentStatus =
  | "REQUESTED" | "AUTHORIZED" | "PROCESSING" | "PENDING" | "COMPLETED"
  | "FAILED" | "DENIED" | "REJECTED" | "CANCELLED" | "PARTIAL" | "UNKNOWN"
  | "REVERSED" | "RECONCILIATION_REQUIRED" | "RECONCILED";
export interface StoredPayment {
  readonly id: Id;
  readonly payerParticipantId?: Id;
  readonly payeeParticipantId?: Id;
  readonly amount: string;
  readonly currency: string;
  readonly purpose: string;
  readonly status: StoredPaymentStatus;
  readonly actorId: Id;
  readonly authorizationId: Id;
  readonly idempotencyKey: string;
  readonly requestId?: Id;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly externalProvider?: string;
  readonly externalReference?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BeatCorePersistenceRecord =
  | StoredPerson | StoredCommunity | StoredIdentity | StoredAccount
  | StoredCredential | StoredSession | StoredParticipant | StoredAccess | StoredPlace
  | StoredContext | StoredRelationship | StoredCapability
  | StoredAuthorization | StoredIntent | StoredProposal | StoredAction
  | StoredEvent | StoredEvidence | StoredPayment;

export const canonicalPersistenceTableNames: readonly PersistenceTable[] =
  persistenceTables.map((definition) => definition.table);
