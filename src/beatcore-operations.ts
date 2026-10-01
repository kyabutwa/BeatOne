import {
  createAction,
  createEvent,
  type Action,
  type Authorization,
  type Event,
  type Id
} from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";

export interface AuthorizedActionCommand {
  readonly actionId: Id;
  readonly eventId: Id;
  readonly actorId: Id;
  readonly operation: string;
  readonly authorization: Authorization;
  readonly proposalId?: Id;
  readonly contextId?: Id;
  readonly correlationId?: Id;
  readonly idempotencyKey?: string;
  readonly eventType: string;
  readonly eventSource: string;
  readonly occurredAt: string;
  readonly eventVersion?: number;
  readonly now?: Date;
}

export interface AuthorizedActionResult {
  readonly action: Action;
  readonly event: Event;
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
  const action = createAction({
    id: command.actionId,
    actorId: command.actorId,
    operation: command.operation,
    authorization: command.authorization,
    ...(command.proposalId ? { proposalId: command.proposalId } : {}),
    ...(command.contextId ? { contextId: command.contextId } : {}),
    ...(command.correlationId ? { correlationId: command.correlationId } : {}),
    ...(command.idempotencyKey ? { idempotencyKey: command.idempotencyKey } : {}),
    ...(command.now ? { now: command.now } : {})
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

  await repository.transaction((tx) => {
    tx.insert("actions", action);
    tx.insert("events", event);
  });

  return { action, event };
}
