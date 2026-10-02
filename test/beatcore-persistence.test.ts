import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalPersistenceTableNames,
  persistenceTables
} from "../src/beatcore-persistence.js";

test("BeatCore persistence represents every canonical entity exactly once", () => {
  assert.equal(persistenceTables.length, 21);
  assert.equal(new Set(canonicalPersistenceTableNames).size, 21);
  assert.deepEqual(canonicalPersistenceTableNames, [
    "persons", "communities", "identities", "accounts", "credentials",
    "sessions", "participants", "accesses", "places", "contexts", "relationships",
    "capabilities", "authorizations", "intents", "proposals", "actions",
    "events", "evidences", "action_executions", "action_outcome_trace", "payments"
  ]);
});
test("persistence ownership is explicit and unique", () => {
  assert.equal(new Set(persistenceTables.map((table) => table.owner)).size, 21);
  assert.ok(persistenceTables.filter((table) => table.table !== "action_outcome_trace").every((table) => table.primaryKey === "id"));
  assert.equal(persistenceTables.find((table) => table.table === "action_outcome_trace")?.primaryKey, "execution_id");
});
test("canonical separation remains explicit", () => {
  assert.notEqual(canonicalPersistenceTableNames.indexOf("identities"), canonicalPersistenceTableNames.indexOf("authorizations"));
  assert.notEqual(canonicalPersistenceTableNames.indexOf("actions"), canonicalPersistenceTableNames.indexOf("events"));
  assert.notEqual(canonicalPersistenceTableNames.indexOf("events"), canonicalPersistenceTableNames.indexOf("evidences"));
});
