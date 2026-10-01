import test from "node:test";
import assert from "node:assert/strict";
import {
  assertActionTransition,
  assertAuthorizationForAction,
  createAction,
  createEvent,
  createEvidence,
  id
} from "../src/beatcore.js";

const actor = id("identity-1");
const participant = id("participant-1");
const capability = id("capability-access");
const context = id("context-1");
const authorization = {
  id: id("auth-1"),
  decision: "ALLOW" as const,
  actorId: actor,
  participantId: participant,
  contextId: context,
  capabilityId: capability,
  validFrom: "2026-01-01T00:00:00.000Z",
  validUntil: "2030-01-01T00:00:00.000Z"
};

test("identity, account, credential and session remain separate concepts", () => {
  assert.equal(typeof actor, "string");
  assert.notEqual("identityId" in authorization, true);
});

test("denied authorization cannot create an action", () => {
  assert.throws(
    () => assertAuthorizationForAction(
      { ...authorization, decision: "DENY" },
      new Date("2026-10-01T00:00:00.000Z")
    ),
    /UNAUTHORIZED/
  );
});

test("conditional authorization cannot create a consequential action", () => {
  assert.throws(
    () => assertAuthorizationForAction(
      { ...authorization, decision: "CONDITIONAL" },
      new Date("2026-10-01T00:00:00.000Z")
    ),
    /UNAUTHORIZED/
  );
});

test("authorization that has not started cannot create an action", () => {
  assert.throws(
    () => assertAuthorizationForAction(
      { ...authorization, validFrom: "2026-11-01T00:00:00.000Z" },
      new Date("2026-10-01T00:00:00.000Z")
    ),
    /EXPIRED/
  );
});

test("expired authorization cannot create an action", () => {
  assert.throws(
    () => assertAuthorizationForAction(
      { ...authorization, validUntil: "2026-09-01T00:00:00.000Z" },
      new Date("2026-10-01T00:00:00.000Z")
    ),
    /EXPIRED/
  );
});

test("action actor must match the authorization actor", () => {
  assert.throws(
    () => createAction({
      id: id("action-actor-mismatch"),
      actorId: id("different-identity"),
      operation: "access.place",
      authorization,
      now: new Date("2026-10-01T00:00:00.000Z")
    }),
    /UNAUTHORIZED/
  );
});

test("authorized action is distinct from event", () => {
  const action = createAction({
    id: id("action-1"),
    actorId: actor,
    operation: "access.place",
    authorization,
    contextId: context,
    correlationId: id("corr-1"),
    idempotencyKey: "access-1",
    now: new Date("2026-10-01T00:00:00.000Z")
  });
  assert.equal(action.state, "AUTHORIZED");
  assert.equal("occurredAt" in action, false);

  const event = createEvent({
    id: id("event-1"),
    action,
    type: "access.authorized",
    occurredAt: "2026-10-01T10:00:00.000Z",
    state: "AUTHORIZED",
    source: "beatcore",
    actorId: actor,
    contextId: context,
    correlationId: id("corr-1"),
    causationId: action.id
  });
  assert.equal(event.actionId, action.id);
  assert.equal(event.version, 1);
});

test("proposal does not silently become an action without authorization", () => {
  const proposal = {
    id: id("proposal-1"),
    actorId: actor,
    intentId: id("intent-1"),
    summary: "enter building"
  };
  assert.equal("authorizationId" in proposal, false);
  assert.throws(
    () => createAction({
      id: id("action-2"),
      actorId: actor,
      operation: "access.place",
      authorization: { ...authorization, decision: "DENY" },
      proposalId: proposal.id,
      now: new Date("2026-10-01T00:00:00.000Z")
    }),
    /UNAUTHORIZED/
  );
});

test("invalid lifecycle transitions are rejected", () => {
  assert.throws(
    () => assertActionTransition("REQUESTED", "COMPLETED"),
    /VALIDATION_FAILURE/
  );
  assert.doesNotThrow(
    () => assertActionTransition("AUTHORIZED", "PROCESSING")
  );
  assert.doesNotThrow(
    () => assertActionTransition("PROCESSING", "COMPLETED")
  );
});

test("event state must match the linked Action state", () => {
  const failedAction = {
    ...createAction({
      id: id("action-3"),
      actorId: actor,
      operation: "resource.write",
      authorization,
      now: new Date("2026-10-01T00:00:00.000Z")
    }),
    state: "FAILED" as const
  };
  assert.throws(
    () => createEvent({
      id: id("event-3"),
      action: failedAction,
      type: "resource.write.completed",
      occurredAt: "2026-10-01T10:00:00.000Z",
      state: "COMPLETED",
      source: "beatcore"
    }),
    /VALIDATION_FAILURE/
  );

  const failedEvent = createEvent({
    id: id("event-3-failed"),
    action: failedAction,
    type: "resource.write.failed",
    occurredAt: "2026-10-01T10:00:00.000Z",
    state: "FAILED",
    source: "beatcore"
  });
  assert.equal(failedEvent.state, "FAILED");
});

test("event attribution must agree with the linked Action", () => {
  const action = createAction({
    id: id("action-event-attribution"),
    actorId: actor,
    operation: "resource.read",
    authorization,
    contextId: context,
    now: new Date("2026-10-01T00:00:00.000Z")
  });

  assert.throws(
    () => createEvent({
      id: id("event-actor-mismatch"),
      action,
      type: "resource.read",
      occurredAt: "2026-10-01T10:00:00.000Z",
      state: "AUTHORIZED",
      source: "beatcore",
      actorId: id("different-identity")
    }),
    /UNAUTHORIZED/
  );

  assert.throws(
    () => createEvent({
      id: id("event-context-mismatch"),
      action,
      type: "resource.read",
      occurredAt: "2026-10-01T10:00:00.000Z",
      state: "AUTHORIZED",
      source: "beatcore",
      contextId: id("different-context")
    }),
    /VALIDATION_FAILURE/
  );
});

test("event version must be a positive integer", () => {
  const action = createAction({
    id: id("action-event-version"),
    actorId: actor,
    operation: "resource.read",
    authorization,
    now: new Date("2026-10-01T00:00:00.000Z")
  });

  assert.throws(
    () => createEvent({
      id: id("event-version-invalid"),
      action,
      type: "resource.read",
      occurredAt: "2026-10-01T10:00:00.000Z",
      state: "AUTHORIZED",
      source: "beatcore",
      version: 0
    }),
    /VALIDATION_FAILURE/
  );
});

test("event is distinct from evidence and evidence defaults to unverified", () => {
  const action = createAction({
    id: id("action-4"),
    actorId: actor,
    operation: "resource.read",
    authorization,
    now: new Date("2026-10-01T00:00:00.000Z")
  });
  const event = createEvent({
    id: id("event-4"),
    action,
    type: "resource.read.authorized",
    occurredAt: "2026-10-01T10:00:00.000Z",
    state: "AUTHORIZED",
    source: "beatcore"
  });
  const evidence = createEvidence({
    id: id("evidence-1"),
    event,
    source: "beatone-domain-record"
  });
  assert.equal(evidence.eventId, event.id);
  assert.equal(evidence.verification, "UNVERIFIED");
  assert.equal("occurredAt" in evidence, false);
});

test("external references remain separate from canonical identity", () => {
  const evidence = createEvidence({
    id: id("evidence-2"),
    source: "payment-provider",
    externalReference: {
      provider: "example-provider",
      reference: "provider-123"
    }
  });
  assert.equal(evidence.externalReference?.provider, "example-provider");
  assert.notEqual(evidence.id, id("provider-123"));
});

test("empty identifiers and required fields are rejected", () => {
  assert.throws(() => id("   "), /ID must not be empty/);
  assert.throws(
    () => createAction({
      id: id("action-invalid"),
      actorId: actor,
      operation: " ",
      authorization,
      now: new Date("2026-10-01T00:00:00.000Z")
    }),
    /INVALID_INPUT/
  );
  assert.throws(
    () => createEvidence({
      id: id("evidence-invalid"),
      source: " "
    }),
    /INVALID_INPUT/
  );
});


