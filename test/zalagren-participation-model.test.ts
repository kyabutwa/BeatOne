import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  ZALAGREN_PARTICIPATING_ENTITY_KINDS,
  isAuthorityBound,
  type ZalagrenParticipatingEntity
} from "../src/zalagren-participation-model.js";

test("expanded participating entity taxonomy includes people, communities, organizations, places, physical assets and providers", () => {
  assert.deepEqual(ZALAGREN_PARTICIPATING_ENTITY_KINDS, [
    "human",
    "community",
    "organization",
    "place",
    "physical_asset",
    "service_provider",
    "service",
    "system"
  ]);
});

test("participation does not grant authority", () => {
  const community: ZalagrenParticipatingEntity = {
    id: "community:tsavo",
    kind: "community",
    displayName: "TSAVO",
    participation: { contextId: "context:tsavo" }
  };

  assert.equal(isAuthorityBound(community, undefined), false);
  assert.equal(
    isAuthorityBound(community, {
      entityId: community.id,
      capabilityId: "capability:manage-community",
      contextId: "context:other",
      authorizationId: "authorization:1"
    }),
    false
  );
  assert.equal(
    isAuthorityBound(community, {
      entityId: community.id,
      capabilityId: "capability:manage-community",
      contextId: "context:tsavo",
      authorizationId: "authorization:1"
    }),
    true
  );
});
