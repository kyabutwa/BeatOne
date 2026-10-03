import test from "node:test";
import assert from "node:assert/strict";
import {
  CONSTANTYNA_CAPABILITIES,
  buildConstantynaSystemContext,
  capabilityForIntent,
  classifyConstantynaIntent,
  hasConstantynaCapability,
  normalizeConstantynaPlan
} from "../src/constantyna.js";

test("Constantyna plan hierarchy is deterministic",()=>{
  assert.equal(normalizeConstantynaPlan("normal"),"normal");
  assert.equal(normalizeConstantynaPlan("plus"),"plus");
  assert.equal(normalizeConstantynaPlan("premium"),"premium");
  assert.equal(normalizeConstantynaPlan("unknown"),"normal");
  assert.equal(hasConstantynaCapability("normal","explain_zalagren"),true);
  assert.equal(hasConstantynaCapability("normal","research"),false);
  assert.equal(hasConstantynaCapability("plus","research"),true);
  assert.equal(hasConstantynaCapability("plus","orchestration"),false);
  assert.equal(hasConstantynaCapability("premium","consequential_action"),true);
});

test("Constantyna intent classification maps to governed capabilities",()=>{
  assert.equal(classifyConstantynaIntent("tell me more about Zalagren"),"EXPLAIN");
  assert.equal(classifyConstantynaIntent("find communities near me"),"DISCOVER");
  assert.equal(classifyConstantynaIntent("compare these services"),"COMPARE");
  assert.equal(classifyConstantynaIntent("research the latest information"),"RESEARCH");
  assert.equal(classifyConstantynaIntent("open my activity"),"NAVIGATE");
  assert.equal(classifyConstantynaIntent("execute this request"),"EXECUTE");
  assert.equal(capabilityForIntent("EXECUTE"),"consequential_action");
});

test("Constantyna system context preserves the authority boundary",()=>{
  const text=buildConstantynaSystemContext({participantId:"p-1" as any,plan:"premium",activeCommunityCount:0,serviceCount:10,capabilityCount:20});
  assert.match(text,/Authentication never implies authorization/);
  assert.match(text,/Never invent/);
  assert.match(text,/Identity -> Participant -> Community/);
  assert.match(text,/Current participant plan: premium/);
});

test("Every capability has an explicit minimum plan and risk",()=>{
  for(const capability of CONSTANTYNA_CAPABILITIES){
    assert.ok(["normal","plus","premium"].includes(capability.minimumPlan));
    assert.ok(["none","low","medium","high"].includes(capability.risk));
    assert.equal(typeof capability.requiresConfirmation,"boolean");
  }
});
