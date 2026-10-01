import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id, type Action, type Authorization } from "../src/beatcore.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";
import type { StoredEvent, StoredEvidence } from "../src/beatcore-persistence.js";

const identity = { id: id("identity:events"), kind: "human" as const };
const capability = { id: id("capability:events"), name: "event test" };
const authorization: Authorization = {
  id: id("authorization:events"),
  decision: "ALLOW",
  actorId: identity.id,
  capabilityId: capability.id,
  validFrom: "2026-10-01T00:00:00.000Z"
};
const action: Action = {
  id: id("action:events"),
  actorId: identity.id,
  authorizationId: authorization.id,
  state: "AUTHORIZED",
  operation: "event.runtime.test"
};
const event: StoredEvent = {
  id: id("event:events"),
  actionId: action.id,
  type: "action.authorized",
  occurredAt: "2026-10-01T12:00:00.000Z",
  state: "AUTHORIZED",
  actorId: identity.id,
  source: "test",
  causationId: action.id,
  version: 1
};
const evidence: StoredEvidence = {
  id: id("evidence:events"),
  eventId: event.id,
  source: "test",
  verification: "UNVERIFIED",
  recordedAt: "2026-10-01T12:00:01.000Z"
};

async function seed(repository: InMemoryPersistenceRepository): Promise<void> {
  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("actions", action);
  });
}

test("Event and Evidence remain distinct canonical persistence records", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);
  await repository.transaction((tx) => {
    tx.insert("events", event);
    tx.insert("evidences", evidence);
  });
  assert.deepEqual(repository.read("events", event.id), event);
  assert.deepEqual(repository.read("evidences", evidence.id), evidence);
  assert.equal(repository.read("payments", event.id), undefined);
});

test("Event linkage enforces Action state, actor, context and references", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);
  await assert.rejects(repository.transaction((tx) => tx.insert("events", { ...event, id: id("event:bad-state"), state: "PROCESSING" })), /VALIDATION_FAILURE/);
  await assert.rejects(repository.transaction((tx) => tx.insert("events", { ...event, id: id("event:bad-actor"), actorId: id("identity:other") })), /UNAUTHORIZED/);
  await assert.rejects(repository.transaction((tx) => tx.insert("events", { ...event, id: id("event:bad-context"), contextId: id("context:other") })), /VALIDATION_FAILURE|NOT_FOUND/);
  await assert.rejects(repository.transaction((tx) => tx.insert("events", { ...event, id: id("event:bad-action"), actionId: id("action:other") })), /NOT_FOUND/);
});

test("Evidence linkage and provider/reference atomicity are enforced", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);
  await repository.transaction((tx) => tx.insert("events", event));
  await assert.rejects(repository.transaction((tx) => tx.insert("evidences", { ...evidence, id: id("evidence:missing"), eventId: id("event:missing") })), /NOT_FOUND/);
  await assert.rejects(repository.transaction((tx) => tx.insert("evidences", { ...evidence, id: id("evidence:provider-only"), externalProvider: "provider" })), /INVALID_INPUT/);
  await repository.transaction((tx) => tx.insert("evidences", { ...evidence, id: id("evidence:verified"), verification: "VERIFIED" }));
  assert.equal(repository.read("evidences", id("evidence:verified"))?.verification, "VERIFIED");
});

test("Event replacement uses strict version CAS", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);
  await repository.transaction((tx) => {
    tx.insert("events", event);
    tx.replace("events", { ...event, state: "PROCESSING", version: 2 });
  });
  assert.equal(repository.read("events", event.id)?.version, 2);
  await assert.rejects(repository.transaction((tx) => tx.replace("events", { ...event, state: "COMPLETED", version: 2 })), /CONFLICT/);
  await assert.rejects(repository.transaction((tx) => tx.replace("events", { ...event, state: "COMPLETED", version: 4 })), /CONFLICT/);
  assert.equal(repository.read("events", event.id)?.state, "PROCESSING");
});

test("Event/Evidence transaction rolls back as one unit", async () => {
  const repository = new InMemoryPersistenceRepository();
  await assert.rejects(repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("actions", action);
    tx.insert("events", event);
    tx.insert("evidences", evidence);
    tx.insert("evidences", { ...evidence, id: id("evidence:duplicate") });
  }), /CONFLICT/);
  assert.equal(repository.read("events", event.id), undefined);
  assert.equal(repository.read("evidences", evidence.id), undefined);
  assert.equal(repository.read("identities", identity.id), undefined);
});
