import type { Id } from "./beatcore.js";
import type {
  ActionExecutionStatus,
  StoredActionExecution,
  StoredActionOutcomeTrace
} from "./beatcore-persistence.js";

export interface ActionExecution extends StoredActionExecution {}
export interface ActionOutcomeTrace extends StoredActionOutcomeTrace {}

export function createActionExecution(input: {
  readonly id: Id;
  readonly actionId: Id;
  readonly proposalId: Id;
  readonly authorizationId: Id;
  readonly status?: ActionExecutionStatus;
  readonly providerReference?: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly result?: unknown;
  readonly idempotencyKey: string;
}): ActionExecution {
  if (!input.id.trim() || !input.actionId.trim() || !input.proposalId.trim() ||
      !input.authorizationId.trim() || !input.idempotencyKey.trim()) {
    throw new Error("INVALID_INPUT");
  }
  const status = input.status ?? "started";
  if (status === "started" && input.finishedAt !== undefined) {
    throw new Error("VALIDATION_FAILURE");
  }
  if (status !== "started" && input.finishedAt === undefined) {
    throw new Error("VALIDATION_FAILURE");
  }
  const startedAt = new Date(input.startedAt);
  if (Number.isNaN(startedAt.getTime())) throw new Error("INVALID_INPUT");
  if (input.finishedAt !== undefined) {
    const finishedAt = new Date(input.finishedAt);
    if (Number.isNaN(finishedAt.getTime()) || finishedAt < startedAt) {
      throw new Error("VALIDATION_FAILURE");
    }
  }
  if (input.providerReference !== undefined && !input.providerReference.trim()) {
    throw new Error("INVALID_INPUT");
  }
  return { ...input, status };
}

export function createActionOutcomeTrace(input: {
  readonly execution: ActionExecution;
  readonly eventId: Id;
  readonly evidenceId: Id;
  readonly createdAt: string;
}): ActionOutcomeTrace {
  if (!input.eventId.trim() || !input.evidenceId.trim()) {
    throw new Error("INVALID_INPUT");
  }
  if (!input.createdAt.trim() || Number.isNaN(new Date(input.createdAt).getTime())) {
    throw new Error("INVALID_INPUT");
  }
  return {
    executionId: input.execution.id,
    eventId: input.eventId,
    evidenceId: input.evidenceId,
    createdAt: input.createdAt
  };
}
