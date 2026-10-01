import { test } from "node:test";
import assert from "node:assert/strict";
import { id } from "../src/beatcore.js";
import {
  executeIntegration,
  type IntegrationAdapter,
  type IntegrationRequest
} from "../src/beatcore-integration.js";

const request: IntegrationRequest = {
  requestId: id("req-1"),
  actionId: id("action-1"),
  operation: "external.operation",
  correlationId: id("corr-1"),
  idempotencyKey: "idem-1",
  payload: { value: "canonical" }
};

function adapter(response: Awaited<ReturnType<IntegrationAdapter["execute"]>>): IntegrationAdapter {
  return { execute: async () => response };
}

test("external acceptance remains ACCEPTED, not completion", async () => {
  const result = await executeIntegration(
    adapter({
      outcome: "ACCEPTED",
      externalReference: { provider: "test", reference: "ext-1" },
      receivedAt: "2026-10-01T10:00:00Z"
    }),
    request
  );

  assert.equal(result.outcome, "ACCEPTED");
  assert.equal(result.reconciliationRequired, false);
  assert.equal(result.externalReference?.reference, "ext-1");
});

test("unknown outcome requires reconciliation", async () => {
  const result = await executeIntegration(
    adapter({
      outcome: "UNKNOWN",
      failure: "RECONCILIATION_REQUIRED",
      receivedAt: "2026-10-01T10:01:00Z"
    }),
    request
  );

  assert.equal(result.outcome, "UNKNOWN");
  assert.equal(result.reconciliationRequired, true);
});

test("timeout remains a failure and never becomes success", async () => {
  const result = await executeIntegration(
    adapter({
      outcome: "UNKNOWN",
      failure: "TIMEOUT",
      receivedAt: "2026-10-01T10:02:00Z"
    }),
    request
  );

  assert.equal(result.outcome, "UNKNOWN");
  assert.equal(result.failure, "TIMEOUT");
  assert.equal(result.reconciliationRequired, true);
});

test("explicit rejection remains rejection", async () => {
  const result = await executeIntegration(
    adapter({
      outcome: "REJECTED",
      receivedAt: "2026-10-01T10:03:00Z"
    }),
    request
  );

  assert.equal(result.outcome, "REJECTED");
  assert.equal(result.reconciliationRequired, false);
});

test("canonical idempotency and correlation data are forwarded unchanged", async () => {
  let observed: IntegrationRequest | undefined;
  const testAdapter: IntegrationAdapter = {
    execute: async (value) => {
      observed = value;
      return {
        outcome: "ACCEPTED",
        receivedAt: "2026-10-01T10:04:00Z"
      };
    }
  };

  await executeIntegration(testAdapter, request);

  assert.equal(observed?.requestId, request.requestId);
  assert.equal(observed?.actionId, request.actionId);
  assert.equal(observed?.correlationId, request.correlationId);
  assert.equal(observed?.idempotencyKey, request.idempotencyKey);
});

test("malformed accepted response is rejected", async () => {
  await assert.rejects(
    () =>
      executeIntegration(
        adapter({
          outcome: "ACCEPTED",
          failure: "DEPENDENCY_FAILURE",
          receivedAt: "2026-10-01T10:05:00Z"
        }),
        request
      ),
    /VALIDATION_FAILURE/
  );
});

test("adapter failure is not converted into canonical completion", async () => {
  const failingAdapter: IntegrationAdapter = {
    execute: async () => {
      throw new Error("DEPENDENCY_FAILURE");
    }
  };

  await assert.rejects(
    () => executeIntegration(failingAdapter, request),
    /DEPENDENCY_FAILURE/
  );
});
