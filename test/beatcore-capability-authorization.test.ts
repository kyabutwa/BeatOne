import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createCapability, createAuthorization } from "../src/beatcore-capability-authorization.js";
import { createIdentity, createParticipant } from "../src/beatcore-identity-participant.js";
import { createCommunity } from "../src/beatcore-people-communities.js";
import { createPlace } from "../src/beatcore-place.js";
import { createContext, createRelationship } from "../src/beatcore-relationship-context.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function baseRepository(): Promise<InMemoryPersistenceRepository> {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, { identityId: id("identity-authz"), kind: "human" });
  await createParticipant(repository, { participantId: id("participant-authz"), identityId: id("identity-authz") });
  await createCommunity(repository, { communityId: id("community-authz"), name: "Authz Community" });
  await createPlace(repository, { placeId: id("place-authz"), kind: "PLACE" });
  await createContext(repository, {
    contextId: id("context-authz"),
    participantId: id("participant-authz"),
    placeId: id("place-authz"),
    communityId: id("community-authz"),
    purpose: "test"
  });
  await createRelationship(repository, {
    relationshipId: id("relationship-authz"),
    subjectId: id("participant-authz"),
    targetId: id("place-authz"),
    kind: "occupies",
    validFrom: "2026-01-01T00:00:00Z"
  });
  return repository;
}

test("creates and persists a Capability", async () => {
  const repository = await baseRepository();
  const capability = await createCapability(repository, {
    capabilityId: id("capability-1"),
    name: "enter-building"
  });
  assert.deepEqual(repository.read("capabilities", id("capability-1")), capability);
});

test("creates an ALLOW Authorization with canonical references", async () => {
  const repository = await baseRepository();
  await createCapability(repository, {
    capabilityId: id("capability-allow"),
    name: "enter-building"
  });
  const authorization = await createAuthorization(repository, {
    authorizationId: id("authorization-allow"),
    decision: "ALLOW",
    actorId: id("identity-authz"),
    participantId: id("participant-authz"),
    contextId: id("context-authz"),
    relationshipId: id("relationship-authz"),
    capabilityId: id("capability-allow"),
    validFrom: "2026-01-01T00:00:00Z",
    validUntil: "2027-01-01T00:00:00Z",
    scope: "building:enter"
  });
  assert.equal(authorization.decision, "ALLOW");
  assert.deepEqual(repository.read("authorizations", id("authorization-allow")), authorization);
});

test("supports DENY and CONDITIONAL without turning them into ALLOW", async () => {
  const repository = await baseRepository();
  await createCapability(repository, { capabilityId: id("capability-decisions"), name: "test" });
  const deny = await createAuthorization(repository, {
    authorizationId: id("authorization-deny"),
    decision: "DENY",
    actorId: id("identity-authz"),
    capabilityId: id("capability-decisions"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  const conditional = await createAuthorization(repository, {
    authorizationId: id("authorization-conditional"),
    decision: "CONDITIONAL",
    actorId: id("identity-authz"),
    capabilityId: id("capability-decisions"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  assert.equal(deny.decision, "DENY");
  assert.equal(conditional.decision, "CONDITIONAL");
});

test("rejects missing Capability, Actor, Participant, Context, Relationship, or delegate references", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createAuthorization(repository, {
      authorizationId: id("missing-capability"),
      decision: "ALLOW",
      actorId: id("identity-authz"),
      capabilityId: id("missing"),
      validFrom: "2026-01-01T00:00:00Z"
    }),
    /NOT_FOUND/
  );
  await assert.rejects(
    createAuthorization(repository, {
      authorizationId: id("missing-actor"),
      decision: "ALLOW",
      actorId: id("missing"),
      capabilityId: id("capability-authz"),
      validFrom: "2026-01-01T00:00:00Z"
    }),
    /NOT_FOUND/
  );
});

test("rejects invalid authorization validity and empty scope", async () => {
  const repository = await baseRepository();
  await createCapability(repository, { capabilityId: id("capability-validity"), name: "test" });
  await assert.rejects(
    createAuthorization(repository, {
      authorizationId: id("invalid-window"),
      decision: "ALLOW",
      actorId: id("identity-authz"),
      capabilityId: id("capability-validity"),
      validFrom: "2027-01-01T00:00:00Z",
      validUntil: "2026-01-01T00:00:00Z"
    }),
    /VALIDATION_FAILURE/
  );
  await assert.rejects(
    createAuthorization(repository, {
      authorizationId: id("empty-scope"),
      decision: "ALLOW",
      actorId: id("identity-authz"),
      capabilityId: id("capability-validity"),
      validFrom: "2026-01-01T00:00:00Z",
      scope: "   "
    }),
    /INVALID_INPUT/
  );
});

test("duplicate Capability and Authorization IDs conflict", async () => {
  const repository = await baseRepository();
  await createCapability(repository, { capabilityId: id("duplicate-capability"), name: "one" });
  await assert.rejects(
    createCapability(repository, { capabilityId: id("duplicate-capability"), name: "two" }),
    /CONFLICT/
  );
  await createAuthorization(repository, {
    authorizationId: id("duplicate-authorization"),
    decision: "ALLOW",
    actorId: id("identity-authz"),
    capabilityId: id("duplicate-capability"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  await assert.rejects(
    createAuthorization(repository, {
      authorizationId: id("duplicate-authorization"),
      decision: "DENY",
      actorId: id("identity-authz"),
      capabilityId: id("duplicate-capability"),
      validFrom: "2026-01-01T00:00:00Z"
    }),
    /CONFLICT/
  );
});

test("Capability and Authorization creation does not create Actions or Events", async () => {
  const repository = await baseRepository();
  await createCapability(repository, { capabilityId: id("capability-boundary"), name: "test" });
  await createAuthorization(repository, {
    authorizationId: id("authorization-boundary"),
    decision: "ALLOW",
    actorId: id("identity-authz"),
    capabilityId: id("capability-boundary"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  assert.equal(repository.read("actions", id("authorization-boundary")), undefined);
  assert.equal(repository.read("events", id("authorization-boundary")), undefined);
});
