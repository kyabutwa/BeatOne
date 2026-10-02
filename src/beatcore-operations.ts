import {
  createAction,
  createEvent,
  createEvidence,
  type Action,
  type Authorization,
  type Event,
  type Id
} from "./beatcore.js";
import { createActionExecution, createActionOutcomeTrace, type ActionExecution, type ActionOutcomeTrace } from "./beatcore-action-execution.js";
import type { PersistenceRepository } from "./beatcore-repository.js";

export interface AuthorizedActionCommand {
  readonly actionId: Id;
  readonly eventId: Id;
  readonly executionId: Id;
  readonly evidenceId: Id;
  readonly actorId: Id;
  readonly operation: string;
  readonly authorization: Authorization;
  readonly proposalId: Id;
  readonly contextId?: Id;
  readonly correlationId?: Id;
  readonly idempotencyKey: string;
  readonly eventType: string;
  readonly eventSource: string;
  readonly occurredAt: string;
  readonly eventVersion?: number;
  readonly now?: Date;
}

export interface AuthorizedActionResult {
  readonly action: Action;
  readonly execution: ActionExecution;
  readonly event: Event;
  readonly evidence: ReturnType<typeof createEvidence>;
  readonly outcomeTrace: ActionOutcomeTrace;
}

/**
 * Executes the narrow canonical local operation:
 * validate -> authorize -> state transition -> persist -> event recording -> commit.
 *
 * No external operation is performed here.
 */
export async function executeAuthorizedAction(
  repository: PersistenceRepository,
  command: AuthorizedActionCommand
): Promise<AuthorizedActionResult> {
  return repository.transaction((tx) => {
    const canonicalAuthorization = tx.get("authorizations", command.authorization.id);
    if (!canonicalAuthorization) throw new Error("NOT_FOUND");

    const action = createAction({
      id: command.actionId,
      actorId: command.actorId,
      operation: command.operation,
      authorization: canonicalAuthorization,
      proposalId: command.proposalId,
      ...(command.contextId ? { contextId: command.contextId } : {}),
      ...(command.correlationId ? { correlationId: command.correlationId } : {}),
      idempotencyKey: command.idempotencyKey,
      ...(command.now ? { now: command.now } : {})
    });

    const execution = createActionExecution({
      id: command.executionId,
      actionId: action.id,
      proposalId: command.proposalId,
      authorizationId: canonicalAuthorization.id,
      startedAt: command.occurredAt,
      idempotencyKey: command.idempotencyKey
    });

    const event = createEvent({
      id: command.eventId,
      action,
      type: command.eventType,
      occurredAt: command.occurredAt,
      state: "AUTHORIZED",
      source: command.eventSource,
      actorId: command.actorId,
      ...(command.contextId ? { contextId: command.contextId } : {}),
      ...(command.correlationId ? { correlationId: command.correlationId } : {}),
      causationId: action.id,
      ...(command.eventVersion !== undefined ? { version: command.eventVersion } : {})
    });

    const evidence = createEvidence({
      id: command.evidenceId,
      event,
      source: command.eventSource,
      recordedAt: command.occurredAt,
      verification: "UNVERIFIED"
    });
    const outcomeTrace = createActionOutcomeTrace({
      execution,
      eventId: event.id,
      evidenceId: evidence.id,
      createdAt: command.occurredAt
    });

    tx.insert("actions", action);
    tx.insert("action_executions", execution);
    tx.insert("events", event);
    tx.insert("evidences", {
      id: evidence.id,
      ...(evidence.eventId ? { eventId: evidence.eventId } : {}),
      source: evidence.source,
      verification: evidence.verification,
      recordedAt: evidence.recordedAt,
      ...(evidence.externalReference ? {
        externalProvider: evidence.externalReference.provider,
        externalReference: evidence.externalReference.reference
      } : {})
    });
    tx.insert("action_outcome_trace", outcomeTrace);
    return { action, execution, event, evidence, outcomeTrace };
  });
}
