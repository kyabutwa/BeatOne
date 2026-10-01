import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalPersistenceTableNames,
  persistenceTables
} from "../src/beatcore-persistence.js";

test("BeatCore persistence represents every canonical entity exactly once", () => {
  assert.equal(persistenceTables.length, 18);
  assert.equal(new Set(canonicalPersistenceTableNames).size, 18);
  assert.deepEqual(canonicalPersistenceTableNames, [
    "persons", "communities", "identities", "accounts", "credentials",
    "sessions", "participants", "accesses", "places", "contexts", "relationships",
    "capabilities", "authorizations", "intents", "proposals", "actions",
    "events", "evidences"
  ]);
});
test("persistence ownership is explicit and unique", () => {
  assert.equal(new Set(persistenceTables.map((table) => table.owner)).size, 18);
  assert.ok(persistenceTables.every((table) => table.primaryKey === "id"));
});
test("canonical separation remains explicit", () => {
  assert.notEqual(canonicalPersistenceTableNames.indexOf("identities"), canonicalPersistenceTableNames.indexOf("authorizations"));
  assert.notEqual(canonicalPersistenceTableNames.indexOf("actions"), canonicalPersistenceTableNames.indexOf("events"));
  assert.notEqual(canonicalPersistenceTableNames.indexOf("events"), canonicalPersistenceTableNames.indexOf("evidences"));
});
