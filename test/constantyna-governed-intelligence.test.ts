import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONSTANTYNA_CAPABILITIES,
  buildConstantynaSystemContext,
  capabilityForIntent,
  classifyConstantynaIntent,
  hasConstantynaCapability,
  normalizeConstantynaPlan
} from "../src/constantyna.js";

test("CONSTANTYNA plan gates grow without changing authority", () => {
  assert.equal(normalizeConstantynaPlan("normal"), "normal");
  assert.equal(normalizeConstantynaPlan("plus"), "plus");
  assert.equal(normalizeConstantynaPlan("premium"), "premium");
  assert.equal(hasConstantynaCapability("normal", "explain_zalagren"), true);
  assert.equal(hasConstantynaCapability("normal", "research"), false);
  assert.equal(hasConstantynaCapability("plus", "research"), true);
  assert.equal(hasConstantynaCapability("plus", "consequential_action"), false);
  assert.equal(hasConstantynaCapability("premium", "consequential_action"), true);
  assert.ok(CONSTANTYNA_CAPABILITIES.some(x => x.code === "explain_missing_data"));
});

test("CONSTANTYNA intent routing covers the governed interaction surface", () => {
  assert.equal(classifyConstantynaIntent("Tell me more about Zalagren"), "EXPLAIN");
  assert.equal(classifyConstantynaIntent("Find a community near me"), "COMMUNITY");
  assert.equal(classifyConstantynaIntent("Compare these services"), "COMPARE");
  assert.equal(classifyConstantynaIntent("What opportunities can I access?"), "OPPORTUNITY");
  assert.equal(classifyConstantynaIntent("Research the latest information"), "RESEARCH");
  assert.equal(classifyConstantynaIntent("Take me to services"), "NAVIGATE");
  assert.equal(classifyConstantynaIntent("Create and send the invitation"), "EXECUTE");
});

test("CONSTANTYNA system context preserves the authority boundary", () => {
  const context = buildConstantynaSystemContext({
    participantId: "participant:test",
    plan: "premium",
    activeCommunityCount: 0,
    serviceCount: 3,
    capabilityCount: 4
  });
  assert.match(context, /does not create authority/i);
  assert.match(context, /no active community context|absence of data|missing/i);
  assert.match(context, /explicit confirmation/i);
  assert.match(context, /subscription level controls product capability/i);
});

