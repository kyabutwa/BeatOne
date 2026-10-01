import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createGenesisOutput } from "../src/beatcore-genesis.js";

test("intelligence output is classified", () => {
  const output = createGenesisOutput({ id: id("intelligence-1"), kind: "OBSERVATION", summary: "Observed condition" });
  assert.equal(output.kind, "OBSERVATION");
});

test("proposal output stays a proposal", () => {
  const output = createGenesisOutput({ id: id("intelligence-2"), kind: "PROPOSAL", summary: "Proposed next step" });
  assert.equal(output.kind, "PROPOSAL");
});
