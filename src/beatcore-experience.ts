import type { Action, Event, Id } from "./beatcore.js";
import type {
  ApplicationActionResponse,
  AuthorizedApplicationCommand
} from "./beatcore-application-api.js";

export type ExperienceUiState =
  | "LOADING"
  | "AVAILABLE"
  | "STALE"
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "UNAUTHORIZED"
  | "UNAVAILABLE";

export type CanonicalApplicationError =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "EXPIRED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILURE";

export interface ExperienceApplicationClient {
  executeAuthorizedCommand(
    command: AuthorizedApplicationCommand
  ): Promise<ApplicationActionResponse>;
}

export interface ExperienceActionView {
  readonly state: ExperienceUiState;
  readonly action: Action;
  readonly event: Event;
}

export interface ExperienceErrorView {
  readonly state: "FAILED" | "UNAUTHORIZED" | "UNAVAILABLE";
  readonly code: CanonicalApplicationError | "TRANSPORT_ERROR";
}

export interface ExperienceRequestState {
  readonly requestId: Id;
  readonly state: ExperienceUiState;
  readonly action?: Action;
  readonly event?: Event;
  readonly error?: ExperienceErrorView;
}

export function pendingExperienceRequest(requestId: Id): ExperienceRequestState {
  return {
    requestId,
    state: "PENDING"
  };
}

export function presentAuthorizedResponse(
  response: ApplicationActionResponse
): ExperienceRequestState {
  const state: ExperienceUiState =
    response.action.state === "COMPLETED" ? "CONFIRMED" : "PENDING";

  return {
    requestId: response.requestId,
    state,
    action: response.action,
    event: response.event
  };
}

export function presentCanonicalError(
  requestId: Id,
  error: unknown
): ExperienceRequestState {
  if (error instanceof Error) {
    const code = error.message as CanonicalApplicationError;
    if (code === "UNAUTHORIZED") {
      return {
        requestId,
        state: "UNAUTHORIZED",
        error: { state: "UNAUTHORIZED", code }
      };
    }

    if (
      code === "INVALID_INPUT" ||
      code === "EXPIRED" ||
      code === "NOT_FOUND" ||
      code === "CONFLICT" ||
      code === "VALIDATION_FAILURE"
    ) {
      return {
        requestId,
        state: "FAILED",
        error: { state: "FAILED", code }
      };
    }
  }

  return {
    requestId,
    state: "UNAVAILABLE",
    error: { state: "UNAVAILABLE", code: "TRANSPORT_ERROR" }
  };
}

export async function submitExperienceAction(
  client: ExperienceApplicationClient,
  command: AuthorizedApplicationCommand
): Promise<ExperienceRequestState> {
  try {
    const response = await client.executeAuthorizedCommand(command);
    return presentAuthorizedResponse(response);
  } catch (error) {
    return presentCanonicalError(command.requestId, error);
  }
}
