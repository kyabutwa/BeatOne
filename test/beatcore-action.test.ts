import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createCapability, createAuthorization } from "../src/beatcore-capability-authorization.js";
import { createIdentity } from "../src/beatcore-identity-participant.js";
import { createIntent, createProposal } from "../src/beatcore-intent-proposal.js";
import { createAuthorizedAction } from "../src/beatcore-action.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function baseRepository(): Promise<InMemoryPersistenceRepository> {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, { identityId: id("identity-action"), kind: "human" });
  await createIdentity(repository, { identityId: id("identity-other-action"), kind: "human" });
  await createCapability(repository, { capabilityId: id("capability-action"), name: "action-test" });
  await createAuthorization(repository, {
    authorizationId: id("authorization-action"),
    decision: "ALLOW",
    actorId: id("identity-action"),
    capabilityId: id("capability-action"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  await createIntent(repository, {
    intentId: id("intent-action"),
    actorId: id("identity-action"),
    purpose: "perform action"
  });
  await createProposal(repository, {
    proposalId: id("proposal-action"),
    actorId: id("identity-action"),
    intentId: id("intent-action"),
    summary: "authorized proposal",
    authorizationId: id("authorization-action")
  });
  return repository;
}

function command(overrides: Partial<Parameters<typeof createAuthorizedAction>[1]> = {}) {
  return {
    actionId: id("action-1"),
    eventId: id("event-1"),
    actorId: id("identity-action"),
    operation: "perform-test-operation",
    authorization: {
      id: id("authorization-action"),
      decision: "ALLOW" as const,
      actorId: id("identity-action"),
      capabilityId: id("capability-action"),
      validFrom: "2026-01-01T00:00:00Z"
    },
    proposalId: id("proposal-action"),
    eventType: "ACTION_AUTHORIZED",
    eventSource: "beatcore-test",
    occurredAt: "2026-06-01T00:00:00Z",
    ...overrides
  };
}

test("creates and persists an authorized Action", async () => {
  const repository = await baseRepository();
  const result = await createAuthorizedAction(repository, command());
  assert.equal(result.action.state, "AUTHORIZED");
  assert.deepEqual(repository.read("actions", id("action-1")), result.action);
  assert.deepEqual(repository.read("events", id("event-1")), result.event);
});

test("Action requires matching Authorization actor", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createAuthorizedAction(repository, command({
      actionId: id("action-mismatch"),
      eventId: id("event-mismatch"),
      actorId: id("identity-other-action")
    })),
    /UNAUTHORIZED/
  );
});

test("Action proposal must belong to the same actor", async () => {
  const repository = await baseRepository();
  await createIntent(repository, {
    intentId: id("intent-other"),
    actorId: id("identity-other-action"),
    purpose: "other actor intent"
  });
  await createProposal(repository, {
    proposalId: id("proposal-other"),
    actorId: id("identity-other-action"),
    intentId: id("intent-other"),
    summary: "other actor proposal"
  });
  await assert.rejects(
    createAuthorizedAction(repository, command({
      actionId: id("action-proposal-mismatch"),
      eventId: id("event-proposal-mismatch"),
      proposalId: id("proposal-other")
    })),
    /UNAUTHORIZED/
  );
});

test("duplicate Action idempotency key conflicts", async () => {
  const repository = await baseRepository();
  await createAuthorizedAction(repository, command({
    idempotencyKey: "action-key"
  }));
  await assert.rejects(
    createAuthorizedAction(repository, command({
      actionId: id("action-duplicate-key"),
      eventId: id("event-duplicate-key"),
      idempotencyKey: "action-key"
    })),
    /CONFLICT/
  );
});

test("repository transaction rolls back Action and Event together", async () => {
  const repository = await baseRepository();
  const action = {
    id: id("action-rollback"),
    actorId: id("identity-action"),
    proposalId: id("proposal-action"),
    authorizationId: id("authorization-action"),
    state: "AUTHORIZED" as const,
    operation: "rollback-test"
  };
  const event = {
    id: id("event-rollback"),
    actionId: action.id,
    type: "ACTION_AUTHORIZED",
    occurredAt: "2026-06-01T00:00:00Z",
    state: "AUTHORIZED" as const,
    source: "beatcore-test",
    version: 1
  };
  await assert.rejects(
    repository.transaction(async (tx) => {
      tx.insert("actions", action);
      tx.insert("events", event);
      throw new Error("ROLLBACK");
    }),
    /ROLLBACK/
  );
  assert.equal(repository.read("actions", action.id), undefined);
  assert.equal(repository.read("events", event.id), undefined);
});
