import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import {
  applyIntegrationOutcome,
  createPayment,
  transitionPayment,
  type Payment
} from "../src/beatcore-payments.js";

const authorization = {
  id: id("authorization-payment"),
  decision: "ALLOW" as const,
  actorId: id("identity-payment"),
  capabilityId: id("capability-payment"),
  validFrom: "2026-01-01T00:00:00Z"
};

function payment(overrides: Partial<Parameters<typeof createPayment>[0]> = {}): Payment {
  return createPayment({
    paymentId: id("payment-1"),
    payerParticipantId: id("participant-payer"),
    payeeParticipantId: id("participant-payee"),
    amount: "100.50",
    currency: "KES",
    purpose: "payment-test",
    actorId: id("identity-payment"),
    authorization,
    idempotencyKey: "payment-key-1",
    createdAt: "2026-06-01T00:00:00Z",
    now: new Date("2026-06-01T00:00:00Z"),
    ...overrides
  });
}

test("creates a canonical provider-neutral Payment", () => {
  const result = payment();
  assert.equal(result.status, "AUTHORIZED");
  assert.equal(result.amount, "100.5");
  assert.equal(result.currency, "KES");
  assert.equal(result.authorizationId, authorization.id);
  assert.equal(result.idempotencyKey, "payment-key-1");
});

test("payment rejects invalid money and currency", () => {
  assert.throws(() => payment({ amount: "0" }), /VALIDATION_FAILURE/);
  assert.throws(() => payment({ amount: "-1.00" }), /VALIDATION_FAILURE/);
  assert.throws(() => payment({ amount: "1e3" }), /VALIDATION_FAILURE/);
  assert.throws(() => payment({ currency: "KE" }), /VALIDATION_FAILURE/);
});

test("payment requires canonical authorization actor and active authorization", () => {
  assert.throws(() => payment({
    actorId: id("identity-other")
  }), /UNAUTHORIZED/);

  assert.throws(() => payment({
    authorization: {
      ...authorization,
      decision: "DENY"
    }
  }), /UNAUTHORIZED/);

  assert.throws(() => payment({
    authorization: {
      ...authorization,
      validUntil: "2026-05-01T00:00:00Z"
    }
  }), /EXPIRED/);
});

test("external acceptance only moves Payment to PROCESSING", () => {
  const result = applyIntegrationOutcome(payment(), {
    outcome: "ACCEPTED",
    externalReference: { provider: "test-provider", reference: "ext-1" },
    receivedAt: "2026-06-01T00:01:00Z"
  });
  assert.equal(result.status, "PROCESSING");
  assert.deepEqual(result.externalReference, {
    provider: "test-provider",
    reference: "ext-1"
  });
});

test("provider uncertainty remains UNKNOWN", () => {
  const result = applyIntegrationOutcome(payment(), {
    outcome: "UNKNOWN",
    receivedAt: "2026-06-01T00:01:00Z"
  });
  assert.equal(result.status, "UNKNOWN");
});

test("provider rejection becomes FAILED, never COMPLETED", () => {
  const result = applyIntegrationOutcome(payment(), {
    outcome: "REJECTED",
    receivedAt: "2026-06-01T00:01:00Z"
  });
  assert.equal(result.status, "FAILED");
  assert.notEqual(result.status, "COMPLETED");
});

test("invalid lifecycle transition is rejected", () => {
  const completed = transitionPayment(
    transitionPayment(payment(), "PROCESSING", "2026-06-01T00:01:00Z"),
    "COMPLETED",
    "2026-06-01T00:02:00Z"
  );
  assert.equal(completed.status, "COMPLETED");
  assert.throws(
    () => transitionPayment(completed, "PROCESSING", "2026-06-01T00:03:00Z"),
    /VALIDATION_FAILURE/
  );
});
