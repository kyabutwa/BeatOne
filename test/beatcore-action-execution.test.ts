import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import { createActionExecution, createActionOutcomeTrace } from "../src/beatcore-action-execution.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function seed(repository: InMemoryPersistenceRepository) {
  await repository.transaction((tx) => {
    tx.insert("identities", { id: id("identity-1"), kind: "human" });
    tx.insert("identities", { id: id("identity-2"), kind: "human" });
    tx.insert("capabilities", { id: id("capability-1"), name: "operate" });
    tx.insert("intents", { id: id("intent-1"), actorId: id("identity-1"), purpose: "operate" });
    tx.insert("proposals", {
      id: id("proposal-1"),
      actorId: id("identity-1"),
      intentId: id("intent-1"),
      summary: "operate"
    });
    tx.insert("authorizations", {
      id: id("authorization-1"),
      decision: "ALLOW",
      actorId: id("identity-1"),
      capabilityId: id("capability-1"),
      validFrom: "2026-10-01T00:00:00.000Z"
    });
    tx.insert("actions", {
      id: id("action-1"),
      actorId: id("identity-1"),
      proposalId: id("proposal-1"),
      authorizationId: id("authorization-1"),
      state: "AUTHORIZED",
      operation: "operate"
    });
    tx.insert("actions", {
      id: id("action-2"),
      actorId: id("identity-1"),
      proposalId: id("proposal-1"),
      authorizationId: id("authorization-1"),
      state: "AUTHORIZED",
      operation: "operate"
    });
    tx.insert("events", {
      id: id("event-1"),
      actionId: id("action-1"),
      type: "ACTION_AUTHORIZED",
      occurredAt: "2026-10-01T01:00:00.000Z",
      state: "AUTHORIZED",
      source: "BeatCore",
      version: 1
    });
    tx.insert("events", {
      id: id("event-2"),
      actionId: id("action-2"),
      type: "ACTION_AUTHORIZED",
      occurredAt: "2026-10-01T01:00:00.000Z",
      state: "AUTHORIZED",
      source: "BeatCore",
      version: 1
    });
    tx.insert("evidences", {
      id: id("evidence-1"),
      eventId: id("event-1"),
      source: "BeatCore",
      verification: "UNVERIFIED",
      recordedAt: "2026-10-01T01:00:00.000Z"
    });
  });
}

test("ActionExecution preserves Action proposal and authorization continuity", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  const execution = createActionExecution({
    id: id("execution-1"),
    actionId: id("action-1"),
    proposalId: id("proposal-1"),
    authorizationId: id("authorization-1"),
    startedAt: "2026-10-01T01:00:00.000Z",
    idempotencyKey: "execution-1"
  });

  await repository.transaction((tx) => {
    tx.insert("action_executions", execution);
  });

  assert.equal(repository.read("action_executions", id("execution-1"))?.actionId, id("action-1"));

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("action_executions", {
        ...execution,
        id: id("execution-2"),
        actionId: id("action-2"),
        idempotencyKey: "execution-2"
      });
    }),
    /VALIDATION_FAILURE/
  );
});

test("ActionOutcomeTrace cannot cross Action boundaries", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  const execution = createActionExecution({
    id: id("execution-1"),
    actionId: id("action-1"),
    proposalId: id("proposal-1"),
    authorizationId: id("authorization-1"),
    startedAt: "2026-10-01T01:00:00.000Z",
    idempotencyKey: "execution-1"
  });

  await repository.transaction((tx) => {
    tx.insert("action_executions", execution);
  });

  const trace = createActionOutcomeTrace({
    execution,
    eventId: id("event-1"),
    evidenceId: id("evidence-1"),
    createdAt: "2026-10-01T01:00:00.000Z"
  });

  await repository.transaction((tx) => {
    tx.insert("action_outcome_trace", trace);
  });

  assert.deepEqual(repository.read("action_outcome_trace", id("execution-1")), trace);

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("action_outcome_trace", {
        ...trace,
        eventId: id("event-2")
      });
    }),
    /VALIDATION_FAILURE/
  );
});

test("ActionExecution lifecycle requires started before a terminal state", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("action_executions", {
        id: id("execution-terminal"),
        actionId: id("action-1"),
        proposalId: id("proposal-1"),
        authorizationId: id("authorization-1"),
        status: "succeeded",
        startedAt: "2026-10-01T01:00:00.000Z",
        finishedAt: "2026-10-01T01:01:00.000Z",
        idempotencyKey: "execution-terminal"
      });
    }),
    /VALIDATION_FAILURE/
  );

  await repository.transaction((tx) => {
    tx.insert("action_executions", {
      id: id("execution-started"),
      actionId: id("action-1"),
      proposalId: id("proposal-1"),
      authorizationId: id("authorization-1"),
      status: "started",
      startedAt: "2026-10-01T01:00:00.000Z",
      idempotencyKey: "execution-started"
    });
    tx.replace("action_executions", {
      id: id("execution-started"),
      actionId: id("action-1"),
      proposalId: id("proposal-1"),
      authorizationId: id("authorization-1"),
      status: "succeeded",
      startedAt: "2026-10-01T01:00:00.000Z",
      finishedAt: "2026-10-01T01:01:00.000Z",
      idempotencyKey: "execution-started"
    });
  });

  assert.equal(repository.read("action_executions", id("execution-started"))?.status, "succeeded");
});
