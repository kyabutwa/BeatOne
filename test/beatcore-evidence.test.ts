import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createCanonicalEvidence } from "../src/beatcore-evidence.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

test("Evidence defaults to UNVERIFIED", () => {
  const evidence = createCanonicalEvidence({
    id: id("evidence-foundation"),
    source: "beatone-test"
  });
  assert.equal(evidence.verification, "UNVERIFIED");
});

test("Evidence preserves explicit verification state", () => {
  assert.equal(
    createCanonicalEvidence({
      id: id("evidence-verified"),
      source: "beatone-test",
      verification: "VERIFIED"
    }).verification,
    "VERIFIED"
  );
  assert.equal(
    createCanonicalEvidence({
      id: id("evidence-rejected"),
      source: "beatone-test",
      verification: "REJECTED"
    }).verification,
    "REJECTED"
  );
});

test("Evidence validates external reference as an atomic pair", () => {
  assert.throws(
    () => createCanonicalEvidence({
      id: id("evidence-provider-empty"),
      source: "beatone-test",
      externalReference: { provider: " ", reference: "ref-1" }
    }),
    /INVALID_INPUT/
  );

  assert.throws(
    () => createCanonicalEvidence({
      id: id("evidence-reference-empty"),
      source: "beatone-test",
      externalReference: { provider: "provider-1", reference: " " }
    }),
    /INVALID_INPUT/
  );
});

test("Evidence validates recordedAt", () => {
  assert.throws(
    () => createCanonicalEvidence({
      id: id("evidence-invalid-time"),
      source: "beatone-test",
      recordedAt: "not-a-time"
    }),
    /INVALID_INPUT/
  );
});

test("repository requires a referenced Event to exist", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("evidences", {
        id: id("evidence-missing-event"),
        eventId: id("event-does-not-exist"),
        source: "beatone-test",
        verification: "UNVERIFIED",
        recordedAt: "2026-10-01T10:00:00.000Z"
      });
    }),
    /NOT_FOUND/
  );
});

test("repository enforces Evidence verification and external reference invariants", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("evidences", {
        id: id("evidence-invalid-verification"),
        source: "beatone-test",
        verification: "INVALID" as never,
        recordedAt: "2026-10-01T10:00:00.000Z"
      });
    }),
    /VALIDATION_FAILURE/
  );

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("evidences", {
        id: id("evidence-partial-reference"),
        source: "beatone-test",
        verification: "UNVERIFIED",
        recordedAt: "2026-10-01T10:00:00.000Z",
        externalProvider: "provider-1"
      });
    }),
    /INVALID_INPUT/
  );
});
