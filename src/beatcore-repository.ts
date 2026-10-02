import type {
  AuthorizationDecision,
  Id,
  LifecycleState,
  VerificationState
} from "./beatcore.js";
import type {
  PersistenceTable,
  StoredPerson,
  StoredCommunity,
  StoredIdentity,
  StoredAccount,
  StoredCredential,
  StoredSession,
  StoredParticipant,
  StoredAccess,
  StoredPlace,
  StoredContext,
  StoredRelationship,
  StoredCapability,
  StoredAuthorization,
  StoredIntent,
  StoredProposal,
  StoredAction,
  StoredActionExecution,
  StoredActionOutcomeTrace,
  StoredEvent,
  StoredEvidence,
  StoredPayment
} from "./beatcore-persistence.js";

export interface PersistenceRecordMap {
  persons: StoredPerson;
  communities: StoredCommunity;
  identities: StoredIdentity;
  accounts: StoredAccount;
  credentials: StoredCredential;
  sessions: StoredSession;
  participants: StoredParticipant;
  accesses: StoredAccess;
  places: StoredPlace;
  contexts: StoredContext;
  relationships: StoredRelationship;
  capabilities: StoredCapability;
  authorizations: StoredAuthorization;
  intents: StoredIntent;
  proposals: StoredProposal;
  actions: StoredAction;
  action_executions: StoredActionExecution;
  events: StoredEvent;
  evidences: StoredEvidence;
  action_outcome_trace: StoredActionOutcomeTrace;
  payments: StoredPayment;
}

export interface PersistenceTransaction {
  get<T extends PersistenceTable>(
    table: T,
    id: Id
  ): PersistenceRecordMap[T] | undefined;

  findActionByIdempotencyKey(
    idempotencyKey: string
  ): StoredAction | undefined;

  findPaymentByIdempotencyKey(
    idempotencyKey: string
  ): StoredPayment | undefined;

  findActionExecutionByIdempotencyKey(
    idempotencyKey: string
  ): StoredActionExecution | undefined;

  insert<T extends PersistenceTable>(
    table: T,
    record: PersistenceRecordMap[T]
  ): void;

  replace<T extends PersistenceTable>(
    table: T,
    record: PersistenceRecordMap[T]
  ): void;
}

export interface PersistenceRepository {
  read<T extends PersistenceTable>(
    table: T,
    id: Id
  ): PersistenceRecordMap[T] | undefined;

  transaction<T>(
    work: (tx: PersistenceTransaction) => Promise<T> | T
  ): Promise<T>;
}

type StoredRecord = PersistenceRecordMap[PersistenceTable];

const failure = (code: string): never => {
  throw new Error(code);
};

const recordKey = (table: PersistenceTable, record: StoredRecord): Id =>
  table === "action_outcome_trace"
    ? (record as StoredActionOutcomeTrace).executionId
    : (record as Exclude<StoredRecord, StoredActionOutcomeTrace>).id;

const requireText = (value: string, code = "INVALID_INPUT"): void => {
  if (!value.trim()) failure(code);
};

const cloneStore = (
  source: Map<PersistenceTable, Map<Id, StoredRecord>>
): Map<PersistenceTable, Map<Id, StoredRecord>> =>
  new Map(
    Array.from(source.entries(), ([table, records]) => [
      table,
      new Map(records)
    ])
  );

function validateRecord(
  table: PersistenceTable,
  record: StoredRecord,
  tx: PersistenceTransaction,
  replacing: boolean
): void {
  const key = recordKey(table, record);
  requireText(key);

  if (!replacing && tx.get(table, key)) {
    failure("CONFLICT");
  }

  const requireReference = (
    referenceTable: PersistenceTable,
    referenceId: Id
  ): void => {
    if (!tx.get(referenceTable, referenceId)) {
      failure("NOT_FOUND");
    }
  };

  switch (table) {
    case "persons":
      break;

    case "communities": {
      const value = record as StoredCommunity;
      requireText(value.name);
      break;
    }

    case "identities": {
      const value = record as StoredIdentity;
      if (value.personId) requireReference("persons", value.personId);
      break;
    }

    case "accounts": {
      const value = record as StoredAccount;
      requireReference("identities", value.identityId);
      break;
    }

    case "credentials": {
      const value = record as StoredCredential;
      requireText(value.kind);
      requireReference("accounts", value.accountId);
      break;
    }

    case "sessions": {
      const value = record as StoredSession;
      requireReference("accounts", value.accountId);
      requireText(value.authenticatedAt);
      requireText(value.expiresAt);
      break;
    }

    case "participants": {
      const value = record as StoredParticipant;
      requireReference("identities", value.identityId);
      if (value.communityId) requireReference("communities", value.communityId);
      if (value.contextId) requireReference("contexts", value.contextId);
      break;
    }

    case "accesses": {
      const value = record as StoredAccess;
      requireReference("participants", value.participantId);
      requireText(value.targetId);
      break;
    }

    case "places": {
      const value = record as StoredPlace;
      if (value.parentId) {
        if (value.parentId === value.id) failure("VALIDATION_FAILURE");
        requireReference("places", value.parentId);
        const parent = tx.get("places", value.parentId);
        if (!parent) failure("NOT_FOUND");

        const allowedParent: Record<StoredPlace["kind"], StoredPlace["kind"] | undefined> = {
          PLACE: undefined,
          BUILDING: "PLACE",
          FLOOR: "BUILDING",
          UNIT: "FLOOR",
          RESOURCE: "UNIT"
        };

        const expected = allowedParent[value.kind];
        if (expected === undefined || parent!.kind !== expected) {
          failure("VALIDATION_FAILURE");
        }
      } else if (value.kind === "FLOOR" || value.kind === "UNIT" || value.kind === "RESOURCE") {
        failure("VALIDATION_FAILURE");
      }
      break;
    }

    case "contexts": {
      const value = record as StoredContext;
      requireReference("participants", value.participantId);
      if (value.placeId) requireReference("places", value.placeId);
      if (value.communityId) requireReference("communities", value.communityId);
      if (value.purpose !== undefined) requireText(value.purpose);
      break;
    }

    case "relationships": {
      const value = record as StoredRelationship;
      requireText(value.subjectId);
      requireText(value.targetId);
      requireText(value.kind);
      requireText(value.validFrom);
      if (value.subjectId === value.targetId) failure("VALIDATION_FAILURE");
      const from = new Date(value.validFrom);
      if (Number.isNaN(from.getTime())) failure("INVALID_INPUT");
      if (value.validUntil) {
        const until = new Date(value.validUntil);
        if (Number.isNaN(until.getTime())) failure("INVALID_INPUT");
        if (until <= from) failure("VALIDATION_FAILURE");
      }
      break;
    }

    case "capabilities": {
      const value = record as StoredCapability;
      requireText(value.name);
      break;
    }

    case "authorizations": {
      const value = record as StoredAuthorization;
      requireReference("identities", value.actorId);
      requireReference("capabilities", value.capabilityId);
      if (value.participantId) requireReference("participants", value.participantId);
      if (value.contextId) requireReference("contexts", value.contextId);
      if (value.relationshipId) requireReference("relationships", value.relationshipId);
      if (value.delegatedBy) requireReference("identities", value.delegatedBy);
      requireText(value.validFrom);
      const from = new Date(value.validFrom);
      if (Number.isNaN(from.getTime())) failure("INVALID_INPUT");
      if (value.validUntil) {
        const until = new Date(value.validUntil);
        if (Number.isNaN(until.getTime())) failure("INVALID_INPUT");
        if (until <= from) failure("VALIDATION_FAILURE");
      }
      if (value.scope !== undefined) requireText(value.scope);
      break;
    }

    case "intents": {
      const value = record as StoredIntent;
      requireReference("identities", value.actorId);
      if (value.contextId) requireReference("contexts", value.contextId);
      requireText(value.purpose);
      break;
    }

    case "proposals": {
      const value = record as StoredProposal;
      requireReference("identities", value.actorId);
      requireReference("intents", value.intentId);
      if (value.authorizationId) {
        requireReference("authorizations", value.authorizationId);
        const authorization = tx.get("authorizations", value.authorizationId);
        if (!authorization) failure("NOT_FOUND");
        const actorId = authorization?.actorId;
        if (!actorId) failure("NOT_FOUND");
        if (actorId !== value.actorId) failure("UNAUTHORIZED");
      }
      requireText(value.summary);
      break;
    }

    case "actions": {
      const value = record as StoredAction;
      requireReference("identities", value.actorId);
      requireReference("authorizations", value.authorizationId);
      const authorization = tx.get("authorizations", value.authorizationId);
      if (!authorization) failure("NOT_FOUND");
      if (authorization!.actorId !== value.actorId) failure("UNAUTHORIZED");
      if (value.proposalId) {
        requireReference("proposals", value.proposalId);
        const proposal = tx.get("proposals", value.proposalId);
        if (!proposal) failure("NOT_FOUND");
        if (proposal!.actorId !== value.actorId) failure("UNAUTHORIZED");
      }
      if (value.contextId) requireReference("contexts", value.contextId);
      requireText(value.operation);

      if (value.idempotencyKey) {
        requireText(value.idempotencyKey);
        const existing = tx.findActionByIdempotencyKey(value.idempotencyKey);
        if (existing && existing.id !== value.id) {
          failure("CONFLICT");
        }
      }
      break;
    }

    case "action_executions": {
      const value = record as StoredActionExecution;
      requireReference("actions", value.actionId);
      requireReference("proposals", value.proposalId);
      requireReference("authorizations", value.authorizationId);
      const action = tx.get("actions", value.actionId);
      const proposal = tx.get("proposals", value.proposalId);
      const authorization = tx.get("authorizations", value.authorizationId);
      if (!action || !proposal || !authorization) failure("NOT_FOUND");
      if (action!.proposalId !== value.proposalId) failure("VALIDATION_FAILURE");
      if (action!.authorizationId !== value.authorizationId) failure("VALIDATION_FAILURE");
      if (proposal!.actorId !== action!.actorId || authorization!.actorId !== action!.actorId) failure("UNAUTHORIZED");
      if (!["started", "succeeded", "failed", "cancelled"].includes(value.status)) failure("VALIDATION_FAILURE");
      requireText(value.startedAt);
      const startedAt = new Date(value.startedAt);
      if (Number.isNaN(startedAt.getTime())) failure("INVALID_INPUT");
      if (value.finishedAt !== undefined) {
        const finishedAt = new Date(value.finishedAt);
        if (Number.isNaN(finishedAt.getTime())) failure("INVALID_INPUT");
        if (finishedAt < startedAt) failure("VALIDATION_FAILURE");
      }
      if (value.status === "started" && value.finishedAt !== undefined) failure("VALIDATION_FAILURE");
      if (value.status !== "started" && value.finishedAt === undefined) failure("VALIDATION_FAILURE");
      if (value.providerReference !== undefined) requireText(value.providerReference);
      requireText(value.idempotencyKey);
      const existing = tx.findActionExecutionByIdempotencyKey(value.idempotencyKey);
      if (existing && existing.id !== value.id) failure("CONFLICT");
      break;
    }

    case "action_outcome_trace": {
      const value = record as StoredActionOutcomeTrace;
      requireReference("action_executions", value.executionId);
      requireReference("events", value.eventId);
      requireReference("evidences", value.evidenceId);
      const execution = tx.get("action_executions", value.executionId);
      const event = tx.get("events", value.eventId);
      const evidence = tx.get("evidences", value.evidenceId);
      if (!execution || !event || !evidence) failure("NOT_FOUND");
      if (event!.actionId !== execution!.actionId) failure("VALIDATION_FAILURE");
      if (evidence!.eventId !== event!.id) failure("VALIDATION_FAILURE");
      requireText(value.createdAt);
      if (Number.isNaN(new Date(value.createdAt).getTime())) failure("INVALID_INPUT");
      break;
    }

    case "events": {
      const value = record as StoredEvent;
      requireText(value.type);
      requireText(value.occurredAt);
      requireText(value.source);

      const occurredAt = new Date(value.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) failure("INVALID_INPUT");

      if (!Number.isInteger(value.version) || value.version < 1) {
        failure("VALIDATION_FAILURE");
      }

      if (value.actionId) {
        requireReference("actions", value.actionId);
        const action = tx.get("actions", value.actionId);
        if (!action) failure("NOT_FOUND");
        if (value.state !== action!.state) failure("VALIDATION_FAILURE");
        if (value.actorId && value.actorId !== action!.actorId) {
          failure("UNAUTHORIZED");
        }
        if (value.contextId && value.contextId !== action!.contextId) {
          failure("VALIDATION_FAILURE");
        }
      }

      if (value.actorId) requireReference("identities", value.actorId);
      if (value.contextId) requireReference("contexts", value.contextId);
      break;
    }

    case "payments": {
      const value = record as StoredPayment;
      requireText(value.purpose);
      requireText(value.idempotencyKey);
      requireText(value.currency);
      if (!/^[A-Z]{3}$/.test(value.currency)) failure("VALIDATION_FAILURE");

      if (!/^\d+(?:\.\d+)?$/.test(value.amount)) failure("VALIDATION_FAILURE");
      if (/^0\d/.test(value.amount)) failure("VALIDATION_FAILURE");
      if (value.amount.includes(".")) {
        const fraction = value.amount.split(".")[1] ?? "";
        if (!fraction || /0$/.test(fraction)) failure("VALIDATION_FAILURE");
      }
      if (value.amount === "0") failure("VALIDATION_FAILURE");

      const statuses = [
        "REQUESTED", "AUTHORIZED", "PROCESSING", "PENDING", "COMPLETED",
        "FAILED", "DENIED", "REJECTED", "CANCELLED", "PARTIAL", "UNKNOWN",
        "REVERSED", "RECONCILIATION_REQUIRED", "RECONCILED"
      ];
      if (!statuses.includes(value.status)) failure("VALIDATION_FAILURE");

      requireReference("identities", value.actorId);
      requireReference("authorizations", value.authorizationId);
      const authorization = tx.get("authorizations", value.authorizationId);
      if (!authorization) failure("NOT_FOUND");
      if (authorization!.actorId !== value.actorId) failure("UNAUTHORIZED");

      if (value.actionId) {
        requireReference("actions", value.actionId);
        const action = tx.get("actions", value.actionId);
        if (!action) failure("NOT_FOUND");
        if (action!.actorId !== value.actorId) failure("UNAUTHORIZED");
        if (action!.authorizationId !== value.authorizationId) failure("VALIDATION_FAILURE");
      }

      if (value.payerParticipantId) requireReference("participants", value.payerParticipantId);
      if (value.payeeParticipantId) requireReference("participants", value.payeeParticipantId);

      for (const reference of [value.requestId, value.correlationId, value.causationId]) {
        if (reference !== undefined) requireText(reference);
      }

      const createdAt = new Date(value.createdAt);
      const updatedAt = new Date(value.updatedAt);
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
        failure("INVALID_INPUT");
      }
      if (updatedAt < createdAt) failure("VALIDATION_FAILURE");

      const hasProvider = Boolean(value.externalProvider);
      const hasReference = Boolean(value.externalReference);
      if (hasProvider !== hasReference) failure("INVALID_INPUT");
      if (hasProvider) {
        requireText(value.externalProvider!);
        requireText(value.externalReference!);
      }

      const existing = tx.findPaymentByIdempotencyKey(value.idempotencyKey);
      if (existing && existing.id !== value.id) failure("CONFLICT");
      break;
    }

    case "evidences": {
      const value = record as StoredEvidence;
      requireText(value.source);
      requireText(value.recordedAt);
      const recordedAt = new Date(value.recordedAt);
      if (Number.isNaN(recordedAt.getTime())) failure("INVALID_INPUT");

      if (value.verification !== "UNVERIFIED" &&
          value.verification !== "VERIFIED" &&
          value.verification !== "REJECTED") {
        failure("VALIDATION_FAILURE");
      }

      if (value.eventId) requireReference("events", value.eventId);

      const hasProvider = Boolean(value.externalProvider);
      const hasReference = Boolean(value.externalReference);
      if (hasProvider !== hasReference) {
        failure("INVALID_INPUT");
      }
      if (hasProvider) {
        requireText(value.externalProvider!);
        requireText(value.externalReference!);
      }
      break;
    }
  }
}

function createTransaction(
  store: Map<PersistenceTable, Map<Id, StoredRecord>>
): PersistenceTransaction {
  const get = <T extends PersistenceTable>(
    table: T,
    id: Id
  ): PersistenceRecordMap[T] | undefined =>
    store.get(table)?.get(id) as PersistenceRecordMap[T] | undefined;

  return {
    get,

    findActionByIdempotencyKey(idempotencyKey: string): StoredAction | undefined {
      requireText(idempotencyKey);
      const actions = store.get("actions");
      if (!actions) return undefined;
      for (const record of actions.values()) {
        const action = record as StoredAction;
        if (action.idempotencyKey === idempotencyKey) return action;
      }
      return undefined;
    },

    findActionExecutionByIdempotencyKey(idempotencyKey: string): StoredActionExecution | undefined {
      requireText(idempotencyKey);
      const executions = store.get("action_executions");
      if (!executions) return undefined;
      for (const record of executions.values()) {
        const execution = record as StoredActionExecution;
        if (execution.idempotencyKey === idempotencyKey) return execution;
      }
      return undefined;
    },

    findPaymentByIdempotencyKey(idempotencyKey: string): StoredPayment | undefined {
      requireText(idempotencyKey);
      const payments = store.get("payments");
      if (!payments) return undefined;
      for (const record of payments.values()) {
        const payment = record as StoredPayment;
        if (payment.idempotencyKey === idempotencyKey) return payment;
      }
      return undefined;
    },

    insert(table, record) {
      validateRecord(table, record as StoredRecord, this, false);
      store.get(table)?.set(recordKey(table, record as StoredRecord), record as StoredRecord);
    },

    replace(table, record) {
      const existing = store.get(table)?.get(recordKey(table, record as StoredRecord));
      if (!existing) {
        failure("NOT_FOUND");
      }
      validateRecord(table, record as StoredRecord, this, true);

      if (table === "action_executions") {
        const existingExecution = existing as StoredActionExecution;
        const replacementExecution = record as StoredActionExecution;
        const allowed: Record<StoredActionExecution["status"], StoredActionExecution["status"][]> = {
          started: ["succeeded", "failed", "cancelled"],
          succeeded: [],
          failed: [],
          cancelled: []
        };
        if (!allowed[existingExecution.status].includes(replacementExecution.status)) failure("CONFLICT");
        if (replacementExecution.status === "started" || replacementExecution.finishedAt === undefined) failure("CONFLICT");
      }

      if (table === "events") {
        const existingEvent = existing as StoredEvent;
        const replacementEvent = record as StoredEvent;
        if (!Number.isInteger(existingEvent.version) || existingEvent.version < 1 ||
            !Number.isInteger(replacementEvent.version) || replacementEvent.version < 1) {
          failure("VALIDATION_FAILURE");
        }
        if (replacementEvent.version !== existingEvent.version + 1) {
          failure("CONFLICT");
        }
      }

      if (table === "payments") {
        const existingPayment = existing as StoredPayment;
        const replacementPayment = record as StoredPayment;
        if (!Number.isInteger(existingPayment.version) || existingPayment.version < 1 ||
            !Number.isInteger(replacementPayment.version) || replacementPayment.version < 1) {
          failure("VALIDATION_FAILURE");
        }
        if (replacementPayment.version !== existingPayment.version + 1) {
          failure("CONFLICT");
        }
        const existingUpdatedAt = new Date(existingPayment.updatedAt);
        const replacementUpdatedAt = new Date(replacementPayment.updatedAt);
        if (replacementUpdatedAt <= existingUpdatedAt) {
          failure("CONFLICT");
        }
      }

      store.get(table)?.set(recordKey(table, record as StoredRecord), record as StoredRecord);
    }
  };
}

export class InMemoryPersistenceRepository implements PersistenceRepository {
  private store = new Map<PersistenceTable, Map<Id, StoredRecord>>([
    ["persons", new Map()],
    ["communities", new Map()],
    ["identities", new Map()],
    ["accounts", new Map()],
    ["credentials", new Map()],
    ["sessions", new Map()],
    ["participants", new Map()],
    ["accesses", new Map()],
    ["places", new Map()],
    ["contexts", new Map()],
    ["relationships", new Map()],
    ["capabilities", new Map()],
    ["authorizations", new Map()],
    ["intents", new Map()],
    ["proposals", new Map()],
    ["actions", new Map()],
    ["action_executions", new Map()],
    ["events", new Map()],
    ["evidences", new Map()],
    ["action_outcome_trace", new Map()],
    ["payments", new Map()]
  ]);

  read<T extends PersistenceTable>(
    table: T,
    id: Id
  ): PersistenceRecordMap[T] | undefined {
    return this.store.get(table)?.get(id) as PersistenceRecordMap[T] | undefined;
  }

  async transaction<T>(
    work: (tx: PersistenceTransaction) => Promise<T> | T
  ): Promise<T> {
    const workingState = cloneStore(this.store);
    const tx = createTransaction(workingState);
    const result = await work(tx);
    this.store = workingState;
    return result;
  }
}

export type RepositoryAuthorizationDecision = AuthorizationDecision;
export type RepositoryLifecycleState = LifecycleState;
export type RepositoryVerificationState = VerificationState;
