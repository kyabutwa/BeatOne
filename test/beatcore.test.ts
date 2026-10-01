import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAuthorizationForAction,
  createAction,
  createEvent,
  createEvidence,
  id
} from "../src/beatcore.js";

const actor = id("identity-1");
const capability = id("capability-access");
const authorization = {
  id: id("auth-1"),
  decision: "ALLOW" as const,
  actorId: actor,
  capabilityId: capability,
  validFrom: "2026-01-01T00:00:00.000Z",
  validUntil: "2030-01-01T00:00:00.000Z"
};

test("identity/account semantics remain separate at the domain boundary", () => {
  assert.equal(typeof actor, "string");
  assert.equal(typeof authorization.id, "string");
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

test("expired authorization cannot create an action", () => {
  assert.throws(
    () => assertAuthorizationForAction(
      { ...authorization, validUntil: "2026-09-01T00:00:00.000Z" },
      new Date("2026-10-01T00:00:00.000Z")
    ),
    /EXPIRED/
  );
});

test("authorized action is distinct from event", () => {
  const action = createAction({
    id: id("action-1"),
    actorId: actor,
    operation: "access.place",
    authorization,
    now: new Date("2026-10-01T00:00:00.000Z")
  });
  assert.equal(action.state, "AUTHORIZED");
  assert.equal("occurredAt" in action, false);

  const event = createEvent({
    id: id("event-1"),
    action,
    type: "access.completed",
    occurredAt: "2026-10-01T10:00:00.000Z",
    state: "COMPLETED"
  });
  assert.equal(event.actionId, action.id);
});

test("event is distinct from evidence", () => {
  const action = createAction({
    id: id("action-2"),
    actorId: actor,
    operation: "resource.read",
    authorization,
    now: new Date("2026-10-01T00:00:00.000Z")
  });
  const event = createEvent({
    id: id("event-2"),
    action,
    type: "resource.read.completed",
    occurredAt: "2026-10-01T10:00:00.000Z",
    state: "COMPLETED"
  });
  const evidence = createEvidence({
    id: id("evidence-1"),
    event,
    source: "beatone-domain-record"
  });
  assert.equal(evidence.eventId, event.id);
  assert.equal(evidence.verification, "UNVERIFIED");
});

test("invalid empty identifiers are rejected", () => {
  assert.throws(() => id("   "), /ID must not be empty/);
});
