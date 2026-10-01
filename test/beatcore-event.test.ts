import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createAction, id } from "../src/beatcore.js";
import { createCanonicalEvent } from "../src/beatcore-event.js";
import { createCapability, createAuthorization } from "../src/beatcore-capability-authorization.js";
import { createIdentity } from "../src/beatcore-identity-participant.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function seed() {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, { identityId: id("identity-event"), kind: "human" });
  await createCapability(repository, { capabilityId: id("capability-event"), name: "event-test" });
  await createAuthorization(repository, {
    authorizationId: id("authorization-event"),
    decision: "ALLOW",
    actorId: id("identity-event"),
    capabilityId: id("capability-event"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  return repository;
}

test("Event is persisted as a distinct occurrence linked to an Action", async () => {
  const repository = await seed();
  const action = createAction({
    id: id("action-event-foundation"),
    actorId: id("identity-event"),
    operation: "event.test",
    authorization: {
      id: id("authorization-event"),
      decision: "ALLOW",
      actorId: id("identity-event"),
      capabilityId: id("capability-event"),
      validFrom: "2026-01-01T00:00:00Z"
    },
    now: new Date("2026-06-01T00:00:00Z")
  });

  await repository.transaction((tx) => {
    tx.insert("actions", action);
    tx.insert("events", createCanonicalEvent({
      id: id("event-foundation"),
      action,
      type: "ACTION_AUTHORIZED",
      occurredAt: "2026-06-01T00:00:00Z",
      state: "AUTHORIZED",
      source: "beatcore-event-test"
    }));
  });

  const event = repository.read("events", id("event-foundation"));
  assert.equal(event?.actionId, action.id);
  assert.equal(event?.state, action.state);
  assert.notEqual(event?.id, action.id);
});

test("repository rejects an Event whose state does not match its Action", async () => {
  const repository = await seed();
  const action = createAction({
    id: id("action-event-state"),
    actorId: id("identity-event"),
    operation: "event.test",
    authorization: {
      id: id("authorization-event"),
      decision: "ALLOW",
      actorId: id("identity-event"),
      capabilityId: id("capability-event"),
      validFrom: "2026-01-01T00:00:00Z"
    },
    now: new Date("2026-06-01T00:00:00Z")
  });

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("actions", action);
      tx.insert("events", {
        id: id("event-invalid-state"),
        actionId: action.id,
        type: "ACTION_COMPLETED",
        occurredAt: "2026-06-01T00:00:00Z",
        state: "COMPLETED",
        source: "beatcore-event-test",
        version: 1
      });
    }),
    /VALIDATION_FAILURE/
  );

  assert.equal(repository.read("actions", action.id), undefined);
  assert.equal(repository.read("events", id("event-invalid-state")), undefined);
});

test("repository rejects invalid Event timestamps and versions", async () => {
  const repository = await seed();
  const action = createAction({
    id: id("action-event-validation"),
    actorId: id("identity-event"),
    operation: "event.test",
    authorization: {
      id: id("authorization-event"),
      decision: "ALLOW",
      actorId: id("identity-event"),
      capabilityId: id("capability-event"),
      validFrom: "2026-01-01T00:00:00Z"
    },
    now: new Date("2026-06-01T00:00:00Z")
  });

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("actions", action);
      tx.insert("events", {
        id: id("event-invalid-time"),
        actionId: action.id,
        type: "ACTION_AUTHORIZED",
        occurredAt: "not-a-time",
        state: "AUTHORIZED",
        source: "beatcore-event-test",
        version: 1
      });
    }),
    /INVALID_INPUT/
  );
});
