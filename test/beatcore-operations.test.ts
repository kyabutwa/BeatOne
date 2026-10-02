import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import { executeAuthorizedAction } from "../src/beatcore-operations.js";
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
    tx.insert("intents", {
      id: id("intent-1"),
      actorId: id("identity-1"),
      purpose: "operate"
    });
    tx.insert("proposals", {
      id: id("proposal-1"),
      actorId: id("identity-1"),
      intentId: id("intent-1"),
      summary: "operate"
    });
    tx.insert("capabilities", {
      id: id("capability-1"),
      name: "operate"
    });
    tx.insert("authorizations", authorization());
  });
}

function command(
  overrides: Partial<Parameters<typeof executeAuthorizedAction>[1]> = {}
) {
  return {
    actionId: id("action-1"),
    eventId: id("event-1"),
    executionId: id("execution-1"),
    evidenceId: id("evidence-1"),
    actorId: id("identity-1"),
    operation: "operate",
    proposalId: id("proposal-1"),
    idempotencyKey: "execution-1",
    authorization: authorization(),
    eventType: "ACTION_AUTHORIZED",
    eventSource: "BeatCore",
    occurredAt: nowIso,
    now,
    ...overrides
  };
}

test("valid authorization creates and atomically records Action and Event", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  const result = await executeAuthorizedAction(repository, command());

  assert.equal(result.action.state, "AUTHORIZED");
  assert.equal(result.action.authorizationId, id("authorization-1"));
  assert.equal(result.execution.actionId, id("action-1"));
  assert.equal(result.execution.proposalId, id("proposal-1"));
  assert.equal(result.execution.authorizationId, id("authorization-1"));
  assert.equal(result.execution.status, "started");
  assert.equal(result.event.actionId, id("action-1"));
  assert.equal(result.event.state, "AUTHORIZED");
  assert.notEqual(result.action.id, result.event.id);

  assert.deepEqual(repository.read("actions", id("action-1")), result.action);
  assert.deepEqual(repository.read("action_executions", id("execution-1")), result.execution);
  assert.deepEqual(repository.read("events", id("event-1")), result.event);
  assert.equal(result.evidence.eventId, id("event-1"));
  assert.equal(result.evidence.verification, "UNVERIFIED");
  assert.deepEqual(repository.read("action_outcome_trace", id("execution-1")), result.outcomeTrace);
});

test("denied authorization cannot create an Action", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await repository.transaction((tx) => {
    tx.replace("authorizations", {
      ...authorization(),
      decision: "DENY"
    });
  });

  await assert.rejects(
    executeAuthorizedAction(repository, command()),
    /UNAUTHORIZED/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
  assert.equal(repository.read("action_executions", id("execution-1")), undefined);
  assert.equal(repository.read("events", id("event-1")), undefined);
  assert.equal(repository.read("evidences", id("evidence-1")), undefined);
  assert.equal(repository.read("action_outcome_trace", id("execution-1")), undefined);
});

test("expired authorization cannot create an Action", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await repository.transaction((tx) => {
    tx.replace("authorizations", {
      ...authorization(),
      validUntil: "2026-10-01T14:30:00.000Z"
    });
  });

  await assert.rejects(
    executeAuthorizedAction(repository, command()),
    /EXPIRED/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
  assert.equal(repository.read("action_executions", id("execution-1")), undefined);
});

test("Event failure rolls back the Action", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await assert.rejects(
    executeAuthorizedAction(
      repository,
      command({
        eventVersion: 0
      })
    ),
    /VALIDATION_FAILURE/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
  assert.equal(repository.read("events", id("event-1")), undefined);
  assert.equal(repository.read("action_executions", id("execution-1")), undefined);
  assert.equal(repository.read("evidences", id("evidence-1")), undefined);
  assert.equal(repository.read("action_outcome_trace", id("execution-1")), undefined);
});

test("duplicate idempotency key cannot create a second consequential Action", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seedAuthorization(repository);

  await executeAuthorizedAction(
    repository,
    command({ idempotencyKey: "operation-1" })
  );

  await assert.rejects(
    executeAuthorizedAction(
      repository,
      command({
        actionId: id("action-2"),
        eventId: id("event-2"),
        idempotencyKey: "operation-1"
      })
    ),
    /CONFLICT/
  );

  assert.ok(repository.read("actions", id("action-1")));
  assert.equal(repository.read("actions", id("action-2")), undefined);
  assert.equal(repository.read("events", id("event-2")), undefined);
});
