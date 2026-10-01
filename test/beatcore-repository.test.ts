import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import {
  InMemoryPersistenceRepository
} from "../src/beatcore-repository.js";

const now = "2026-10-01T12:00:00.000Z";

const identity = {
  id: id("identity-1"),
  kind: "human" as const
};

const capability = {
  id: id("capability-1"),
  name: "operate"
};

const authorization = {
  id: id("authorization-1"),
  decision: "ALLOW" as const,
  actorId: identity.id,
  capabilityId: capability.id,
  validFrom: now
};

test("repository starts with committed state only", () => {
  const repository = new InMemoryPersistenceRepository();
  assert.equal(repository.read("identities", identity.id), undefined);
});

test("canonical records can be inserted and read", async () => {
  const repository = new InMemoryPersistenceRepository();

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
  });

  assert.deepEqual(repository.read("identities", identity.id), identity);
  assert.deepEqual(
    repository.read("authorizations", authorization.id),
    authorization
  );
});

test("duplicate canonical IDs are rejected", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("identities", identity);
      tx.insert("identities", identity);
    }),
    /CONFLICT/
  );

  assert.equal(repository.read("identities", identity.id), undefined);
});

test("required references are enforced", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("accounts", {
        id: id("account-1"),
        identityId: id("missing"),
        status: "ACTIVE"
      });
    }),
    /NOT_FOUND/
  );
});

test("proposal may exist without authorization", async () => {
  const repository = new InMemoryPersistenceRepository();

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("intents", {
      id: id("intent-1"),
      actorId: identity.id,
      purpose: "test"
    });
    tx.insert("proposals", {
      id: id("proposal-1"),
      actorId: identity.id,
      intentId: id("intent-1"),
      summary: "proposed operation"
    });
  });

  assert.ok(repository.read("proposals", id("proposal-1")));
});

test("action requires persisted authorization", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("identities", identity);
      tx.insert("actions", {
        id: id("action-1"),
        actorId: identity.id,
        authorizationId: id("missing"),
        state: "AUTHORIZED",
        operation: "operate"
      });
    }),
    /NOT_FOUND/
  );

  assert.equal(repository.read("actions", id("action-1")), undefined);
});

test("action idempotency keys are unique", async () => {
  const repository = new InMemoryPersistenceRepository();

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("actions", {
      id: id("action-1"),
      actorId: identity.id,
      authorizationId: authorization.id,
      state: "AUTHORIZED",
      operation: "operate",
      idempotencyKey: "operation-1"
    });
  });

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("actions", {
        id: id("action-2"),
        actorId: identity.id,
        authorizationId: authorization.id,
        state: "AUTHORIZED",
        operation: "operate",
        idempotencyKey: "operation-1"
      });
    }),
    /CONFLICT/
  );
});

test("Event and Evidence remain separate from Action", async () => {
  const repository = new InMemoryPersistenceRepository();

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("actions", {
      id: id("action-1"),
      actorId: identity.id,
      authorizationId: authorization.id,
      state: "AUTHORIZED",
      operation: "operate"
    });
    tx.insert("events", {
      id: id("event-1"),
      actionId: id("action-1"),
      type: "ACTION_AUTHORIZED",
      occurredAt: now,
      state: "AUTHORIZED",
      source: "BeatCore",
      version: 1
    });
    tx.insert("evidences", {
      id: id("evidence-1"),
      eventId: id("event-1"),
      source: "BeatCore",
      verification: "UNVERIFIED",
      recordedAt: now
    });
  });

  assert.ok(repository.read("actions", id("action-1")));
  assert.ok(repository.read("events", id("event-1")));
  assert.ok(repository.read("evidences", id("evidence-1")));
});

test("failed transaction rolls back every earlier local write", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("identities", identity);
      tx.insert("capabilities", capability);
      tx.insert("authorizations", authorization);
      tx.insert("actions", {
        id: id("action-1"),
        actorId: identity.id,
        authorizationId: authorization.id,
        state: "AUTHORIZED",
        operation: "operate"
      });
      tx.insert("events", {
        id: id("event-1"),
        actionId: id("missing-action"),
        type: "ACTION_AUTHORIZED",
        occurredAt: now,
        state: "AUTHORIZED",
        source: "BeatCore",
        version: 1
      });
    }),
    /NOT_FOUND/
  );

  assert.equal(repository.read("identities", identity.id), undefined);
  assert.equal(repository.read("capabilities", capability.id), undefined);
  assert.equal(repository.read("authorizations", authorization.id), undefined);
  assert.equal(repository.read("actions", id("action-1")), undefined);
});

test("successful transaction commits all local writes together", async () => {
  const repository = new InMemoryPersistenceRepository();

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("actions", {
      id: id("action-1"),
      actorId: identity.id,
      authorizationId: authorization.id,
      state: "AUTHORIZED",
      operation: "operate"
    });
    tx.insert("events", {
      id: id("event-1"),
      actionId: id("action-1"),
      type: "ACTION_AUTHORIZED",
      occurredAt: now,
      state: "AUTHORIZED",
      source: "BeatCore",
      version: 1
    });
  });

  assert.ok(repository.read("identities", identity.id));
  assert.ok(repository.read("actions", id("action-1")));
  assert.ok(repository.read("events", id("event-1")));
});
