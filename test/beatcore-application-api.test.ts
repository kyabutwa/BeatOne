import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import {
  executeAuthorizedApplicationCommand,
  getCommittedAction
} from "../src/beatcore-application-api.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

const now = new Date("2026-10-01T15:00:00.000Z");
const nowIso = now.toISOString();

function authorization() {
  return {
    id: id("authorization-1"),
    decision: "ALLOW" as const,
    actorId: id("identity-1"),
    capabilityId: id("capability-1"),
    validFrom: "2026-10-01T14:00:00.000Z",
    validUntil: "2026-10-01T16:00:00.000Z"
  };
}

async function seedAuthorization(repository: InMemoryPersistenceRepository) {
  await repository.transaction((tx) => {
    tx.insert("identities", {
      id: id("identity-1"),
      kind: "human"
    });
    tx.insert("capabilities", {
      id: id("capability-1"),
      name: "operate"
    });
    tx.insert("authorizations", authorization());
  });
}

function command(
  overrides: Partial<Parameters<typeof executeAuthorizedApplicationCommand>[1]> = {}
) {
  return {
    requestId: id("request-1"),
    actionId: id("action-1"),
    eventId: id("event-1"),
    actorId: id("identity-1"),
    operation: "operate",
    authorization: authorization(),
    eventType: "ACTION_AUTHORIZED",
    eventSource: "BeatCore.Application",
    occurredAt: nowIso,
    now,
    ...overrides
  };
}

test("application command delegates to canonical domain operation and returns Action/Event", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  const result = await executeAuthorizedApplicationCommand(repository, command());

  assert.equal(result.requestId, id("request-1"));
  assert.equal(result.action.state, "AUTHORIZED");
  assert.equal(result.event.actionId, result.action.id);
  assert.notEqual(result.action.id, result.event.id);
  assert.deepEqual(getCommittedAction(repository, result.action.id).action, result.action);
});

test("actor/authorization mismatch cannot bypass BeatCore", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await assert.rejects(
    executeAuthorizedApplicationCommand(
      repository,
      command({ actorId: id("different-identity") })
    ),
    /UNAUTHORIZED/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
  assert.equal(repository.read("events", id("event-1")), undefined);
});

test("denied authorization remains a domain authorization error", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await repository.transaction((tx) => {
    tx.replace("authorizations", {
      ...authorization(),
      decision: "DENY"
    });
  });

  await assert.rejects(
    executeAuthorizedApplicationCommand(repository, command()),
    /UNAUTHORIZED/
  );
});

test("expired authorization remains a domain expiry error", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await repository.transaction((tx) => {
    tx.replace("authorizations", {
      ...authorization(),
      validUntil: "2026-10-01T14:30:00.000Z"
    });
  });

  await assert.rejects(
    executeAuthorizedApplicationCommand(repository, command()),
    /EXPIRED/
  );
});

test("duplicate idempotency remains a conflict", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await executeAuthorizedApplicationCommand(
    repository,
    command({ idempotencyKey: "operation-1" })
  );

  await assert.rejects(
    executeAuthorizedApplicationCommand(
      repository,
      command({
        actionId: id("action-2"),
        eventId: id("event-2"),
        idempotencyKey: "operation-1"
      })
    ),
    /CONFLICT/
  );

  assert.equal(repository.read("actions", id("action-2")), undefined);
});

test("event failure remains atomic through the canonical repository transaction", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await assert.rejects(
    executeAuthorizedApplicationCommand(
      repository,
      command({ eventVersion: 0 })
    ),
    /VALIDATION_FAILURE/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
  assert.equal(repository.read("events", id("event-1")), undefined);
});

test("missing Action query returns NOT_FOUND", async () => {
  const repository = new InMemoryPersistenceRepository();

  assert.throws(
    () => getCommittedAction(repository, id("missing-action")),
    /NOT_FOUND/
  );
});

test("Action query does not mutate committed state", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  const result = await executeAuthorizedApplicationCommand(repository, command());
  const before = repository.read("actions", result.action.id);

  const queried = getCommittedAction(repository, result.action.id);

  assert.deepEqual(queried.action, before);
  assert.deepEqual(repository.read("events", result.event.id), result.event);
});
