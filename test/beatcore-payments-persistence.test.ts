import test from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

const now = "2026-10-01T12:00:00.000Z";

const identity = { id: id("payment-identity-1"), kind: "human" as const };
const capability = { id: id("payment-capability-1"), name: "make-payment" };
const authorization = {
  id: id("payment-authorization-1"),
  decision: "ALLOW" as const,
  actorId: identity.id,
  capabilityId: capability.id,
  validFrom: now
};
const participant = {
  id: id("payment-participant-1"),
  identityId: identity.id
};

const payment = {
  id: id("payment-1"),
  payerParticipantId: participant.id,
  payeeParticipantId: participant.id,
  amount: "12.5",
  currency: "KES",
  purpose: "test payment",
  status: "AUTHORIZED" as const,
  actorId: identity.id,
  authorizationId: authorization.id,
  idempotencyKey: "payment-operation-1",
  requestId: id("request-1"),
  correlationId: id("correlation-1"),
  causationId: id("causation-1"),
  createdAt: now,
  updatedAt: now
};

async function seed(repository: InMemoryPersistenceRepository): Promise<void> {
  await repository.transaction((tx) => {
    tx.insert("identities", identity);
    tx.insert("capabilities", capability);
    tx.insert("authorizations", authorization);
    tx.insert("participants", participant);
  });
}

test("payments are a distinct canonical persistence table", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await repository.transaction((tx) => {
    tx.insert("payments", payment);
  });

  assert.deepEqual(repository.read("payments", payment.id), payment);
  assert.equal(repository.read("actions", payment.id), undefined);
  assert.equal(repository.read("events", payment.id), undefined);
  assert.equal(repository.read("evidences", payment.id), undefined);
});

test("payment participant and authorization references are enforced", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-missing-participant"), payerParticipantId: id("missing") });
    }),
    /NOT_FOUND/
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-missing-authorization"), authorizationId: id("missing") });
    }),
    /NOT_FOUND/
  );
});

test("payment actor must match the persisted authorization actor", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);
  const otherIdentity = { id: id("payment-identity-2"), kind: "human" as const };

  await repository.transaction((tx) => {
    tx.insert("identities", otherIdentity);
  });

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", {
        ...payment,
        id: id("payment-unauthorized-actor"),
        actorId: otherIdentity.id
      });
    }),
    /UNAUTHORIZED/
  );
});

test("payment money and currency are persisted as exact canonical values", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await repository.transaction((tx) => {
    tx.insert("payments", payment);
  });

  const stored = repository.read("payments", payment.id);
  assert.equal(stored?.amount, "12.5");
  assert.equal(stored?.currency, "KES");

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-leading-zero"), idempotencyKey: "payment-invalid-leading-zero", amount: "012.5" });
    }),
    /VALIDATION_FAILURE/
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-trailing-zero"), idempotencyKey: "payment-invalid-trailing-zero", amount: "12.50" });
    }),
    /VALIDATION_FAILURE/
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-zero"), idempotencyKey: "payment-invalid-zero", amount: "0" });
    }),
    /VALIDATION_FAILURE/
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", { ...payment, id: id("payment-bad-currency"), idempotencyKey: "payment-invalid-currency", currency: "ke" });
    }),
    /VALIDATION_FAILURE/
  );
});

test("payment idempotency keys reject conflicting consequential reuse", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await repository.transaction((tx) => {
    tx.insert("payments", payment);
  });

  assert.deepEqual(
    repository.read("payments", payment.id),
    repository.read("payments", payment.id)
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", {
        ...payment,
        id: id("payment-2")
      });
    }),
    /CONFLICT/
  );
});

test("provider reference is atomic and does not imply completion", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("payments", {
        ...payment,
        id: id("payment-provider-only"),
        externalProvider: "provider"
      });
    }),
    /INVALID_INPUT/
  );

  await repository.transaction((tx) => {
    tx.insert("payments", {
      ...payment,
      id: id("payment-processing"),
      status: "PROCESSING",
      externalProvider: "provider",
      externalReference: "external-1"
    });
  });

  assert.equal(
    repository.read("payments", id("payment-processing"))?.status,
    "PROCESSING"
  );
});

test("UNKNOWN and reconciliation-required states remain payment-domain states", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await repository.transaction((tx) => {
    tx.insert("payments", { ...payment, id: id("payment-unknown"), status: "UNKNOWN" });
    tx.insert("payments", {
      ...payment,
      id: id("payment-reconcile"),
      status: "RECONCILIATION_REQUIRED",
      idempotencyKey: "payment-operation-2"
    });
  });

  assert.equal(repository.read("payments", id("payment-unknown"))?.status, "UNKNOWN");
  assert.equal(
    repository.read("payments", id("payment-reconcile"))?.status,
    "RECONCILIATION_REQUIRED"
  );
});

test("invalid payment writes roll back the complete local transaction", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("identities", identity);
      tx.insert("capabilities", capability);
      tx.insert("authorizations", authorization);
      tx.insert("participants", participant);
      tx.insert("payments", payment);
      tx.insert("payments", { ...payment, id: id("payment-rollback-duplicate") });
    }),
    /CONFLICT/
  );

  assert.equal(repository.read("identities", identity.id), undefined);
  assert.equal(repository.read("capabilities", capability.id), undefined);
  assert.equal(repository.read("authorizations", authorization.id), undefined);
  assert.equal(repository.read("participants", participant.id), undefined);
  assert.equal(repository.read("payments", payment.id), undefined);
});

test("payment replacement preserves identity and rejects stale temporal state", async () => {
  const repository = new InMemoryPersistenceRepository();
  await seed(repository);

  await repository.transaction((tx) => {
    tx.insert("payments", payment);
    tx.replace("payments", { ...payment, status: "PROCESSING", updatedAt: "2026-10-01T12:01:00.000Z" });
  });

  assert.equal(repository.read("payments", payment.id)?.status, "PROCESSING");

  await assert.rejects(
    repository.transaction((tx) => {
      tx.replace("payments", {
        ...payment,
        status: "COMPLETED",
        updatedAt: "2026-10-01T11:59:00.000Z"
      });
    }),
    /VALIDATION_FAILURE/
  );

  assert.equal(repository.read("payments", payment.id)?.status, "PROCESSING");
});
