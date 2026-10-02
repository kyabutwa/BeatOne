import {
  type Action,
  type Authorization,
  type Event,
  type Id
} from "./beatcore.js";
import {
  executeAuthorizedAction,
  type AuthorizedActionResult
} from "./beatcore-operations.js";
import type { PersistenceRepository } from "./beatcore-repository.js";

export interface AuthorizedApplicationCommand {
  readonly requestId: Id;
  readonly actionId: Id;
  readonly eventId: Id;
  readonly executionId: Id;
  readonly evidenceId: Id;
  readonly actorId: Id;
  readonly operation: string;
  /**
   * Trusted server-side authorization context.
   * A future transport must not accept arbitrary client authority as truth.
   */
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

export interface ApplicationActionResponse {
  readonly requestId: Id;
  readonly action: Action;
  readonly event: Event;
  readonly execution: AuthorizedActionResult["execution"];
  readonly evidence: AuthorizedActionResult["evidence"];
  readonly outcomeTrace: AuthorizedActionResult["outcomeTrace"];
}

export interface ActionQueryResponse {
  readonly action: Action;
}

export async function executeAuthorizedApplicationCommand(
  repository: PersistenceRepository,
  command: AuthorizedApplicationCommand
): Promise<ApplicationActionResponse> {
  if (!command.requestId.trim()) throw new Error("INVALID_INPUT");

  const result: AuthorizedActionResult = await executeAuthorizedAction(
    repository,
    {
      actionId: command.actionId,
      eventId: command.eventId,
      executionId: command.executionId,
      evidenceId: command.evidenceId,
      actorId: command.actorId,
      operation: command.operation,
      authorization: command.authorization,
      proposalId: command.proposalId,
      ...(command.contextId ? { contextId: command.contextId } : {}),
      ...(command.correlationId ? { correlationId: command.correlationId } : {}),
      idempotencyKey: command.idempotencyKey,
      eventType: command.eventType,
      eventSource: command.eventSource,
      occurredAt: command.occurredAt,
      ...(command.eventVersion !== undefined ? { eventVersion: command.eventVersion } : {}),
      ...(command.now ? { now: command.now } : {})
    }
  );

  return {
    requestId: command.requestId,
    action: result.action,
    execution: result.execution,
    event: result.event,
    evidence: result.evidence,
    outcomeTrace: result.outcomeTrace
  };
}

export function getCommittedAction(
  repository: PersistenceRepository,
  actionId: Id
): ActionQueryResponse {
  const action = repository.read("actions", actionId);
  if (!action) throw new Error("NOT_FOUND");
  return { action };
}
