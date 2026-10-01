import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import {
  pendingExperienceRequest,
  presentAuthorizedResponse,
  presentCanonicalError,
  submitExperienceAction,
  type ExperienceApplicationClient
} from "../src/beatcore-experience.js";
import type {
  ApplicationActionResponse,
  AuthorizedApplicationCommand
} from "../src/beatcore-application-api.js";

const now = new Date("2026-10-01T15:00:00.000Z");

function command(): AuthorizedApplicationCommand {
  return {
    requestId: id("request-1"),
    actionId: id("action-1"),
    eventId: id("event-1"),
    actorId: id("identity-1"),
    operation: "operate",
    authorization: {
      id: id("authorization-1"),
      decision: "ALLOW",
      actorId: id("identity-1"),
      capabilityId: id("capability-1"),
      validFrom: "2026-10-01T14:00:00.000Z",
      validUntil: "2026-10-01T16:00:00.000Z"
    },
    eventType: "ACTION_AUTHORIZED",
    eventSource: "BeatCore.Application",
    occurredAt: now.toISOString(),
    now
  };
}

function response(): ApplicationActionResponse {
  const action = {
    id: id("action-1"),
    actorId: id("identity-1"),
    operation: "operate",
    authorizationId: id("authorization-1"),
    state: "AUTHORIZED" as const,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  return {
    requestId: id("request-1"),
    action,
    event: {
      id: id("event-1"),
      type: "ACTION_AUTHORIZED",
      occurredAt: now.toISOString(),
      actorId: id("identity-1"),
      source: "BeatCore.Application",
      actionId: id("action-1"),
      state: "AUTHORIZED" as const,
      version: 1
    }
  };
}

test("pending state is presentation state and does not claim completion", () => {
  const result = pendingExperienceRequest(id("request-1"));
  assert.equal(result.state, "PENDING");
});

test("authorized Action/Event response preserves canonical semantics", () => {
  const result = presentAuthorizedResponse(response());

  assert.equal(result.state, "PENDING");
  assert.equal(result.action?.state, "AUTHORIZED");
  assert.equal(result.event?.actionId, result.action?.id);
  assert.notEqual(result.action?.id, result.event?.id);
});

test("canonical unauthorized error maps to UNAUTHORIZED", () => {
  const result = presentCanonicalError(
    id("request-1"),
    new Error("UNAUTHORIZED")
  );

  assert.equal(result.state, "UNAUTHORIZED");
  assert.equal(result.error?.code, "UNAUTHORIZED");
});

test("canonical domain errors remain distinguishable from transport failure", () => {
  const failed = presentCanonicalError(
    id("request-1"),
    new Error("VALIDATION_FAILURE")
  );
  const unavailable = presentCanonicalError(
    id("request-1"),
    new Error("network connection lost")
  );

  assert.equal(failed.state, "FAILED");
  assert.equal(failed.error?.code, "VALIDATION_FAILURE");
  assert.equal(unavailable.state, "UNAVAILABLE");
  assert.equal(unavailable.error?.code, "TRANSPORT_ERROR");
});

test("client boundary forwards the canonical command and returns its canonical response", async () => {
  let received: AuthorizedApplicationCommand | undefined;

  const client: ExperienceApplicationClient = {
    async executeAuthorizedCommand(input) {
      received = input;
      return response();
    }
  };

  const result = await submitExperienceAction(client, command());

  assert.deepEqual(received, command());
  assert.equal(result.requestId, id("request-1"));
  assert.equal(result.state, "PENDING");
  assert.equal(result.action?.state, "AUTHORIZED");
});

test("client transport failure cannot become successful confirmation", async () => {
  const client: ExperienceApplicationClient = {
    async executeAuthorizedCommand() {
      throw new Error("network unavailable");
    }
  };

  const result = await submitExperienceAction(client, command());

  assert.equal(result.state, "UNAVAILABLE");
  assert.equal(result.error?.code, "TRANSPORT_ERROR");
  assert.notEqual(result.state, "CONFIRMED");
});

test("a later canonical COMPLETED Action may be presented as CONFIRMED", () => {
  const completed = {
    ...response(),
    action: {
      ...response().action,
      state: "COMPLETED" as const
    }
  };

  const result = presentAuthorizedResponse(completed);

  assert.equal(result.state, "CONFIRMED");
});
