import type { Id } from "./beatcore.js";

export type IntegrationOutcome =
  | "ACCEPTED"
  | "REJECTED"
  | "UNKNOWN";

export type IntegrationFailure =
  | "TIMEOUT"
  | "DEPENDENCY_FAILURE"
  | "RECONCILIATION_REQUIRED";

export interface ExternalReference {
  readonly provider: string;
  readonly reference: string;
}

export interface IntegrationRequest {
  readonly requestId: Id;
  readonly actionId: Id;
  readonly operation: string;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly idempotencyKey?: string;
  readonly payload: unknown;
}

export interface IntegrationResponse {
  readonly outcome: IntegrationOutcome;
  readonly externalReference?: ExternalReference;
  readonly failure?: IntegrationFailure;
  readonly receivedAt: string;
}

export interface IntegrationAdapter {
  execute(request: IntegrationRequest): Promise<IntegrationResponse>;
}

export interface NormalizedIntegrationResult {
  readonly requestId: Id;
  readonly actionId: Id;
  readonly outcome: IntegrationOutcome;
  readonly externalReference?: ExternalReference;
  readonly failure?: IntegrationFailure;
  readonly reconciliationRequired: boolean;
  readonly receivedAt: string;
}

function requireText(value: string, code = "INVALID_INPUT"): void {
  if (!value.trim()) throw new Error(code);
}

function validateResponse(response: IntegrationResponse): void {
  requireText(response.receivedAt);

  if (
    response.outcome === "ACCEPTED" &&
    response.failure !== undefined
  ) {
    throw new Error("VALIDATION_FAILURE");
  }

  if (
    (response.outcome === "REJECTED" || response.outcome === "UNKNOWN") &&
    response.failure === undefined &&
    response.outcome === "UNKNOWN"
  ) {
    throw new Error("VALIDATION_FAILURE");
  }

  if (response.externalReference) {
    requireText(response.externalReference.provider);
    requireText(response.externalReference.reference);
  }

  if (response.failure === "RECONCILIATION_REQUIRED" && response.outcome !== "UNKNOWN") {
    throw new Error("VALIDATION_FAILURE");
  }
}

/**
 * Executes a provider-neutral adapter call and normalizes its result.
 *
 * This boundary deliberately does not mutate BeatCore persistence, create
 * Events, mark Actions completed, or treat external acceptance as completion.
 */
export async function executeIntegration(
  adapter: IntegrationAdapter,
  request: IntegrationRequest
): Promise<NormalizedIntegrationResult> {
  requireText(request.requestId);
  requireText(request.actionId);
  requireText(request.operation);

  const response = await adapter.execute(request);
  validateResponse(response);

  return {
    requestId: request.requestId,
    actionId: request.actionId,
    outcome: response.outcome,
    ...(response.externalReference
      ? { externalReference: response.externalReference }
      : {}),
    ...(response.failure ? { failure: response.failure } : {}),
    reconciliationRequired:
      response.outcome === "UNKNOWN" ||
      response.failure === "RECONCILIATION_REQUIRED",
    receivedAt: response.receivedAt
  };
}
