import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createIdentity, createParticipant } from "../src/beatcore-identity-participant.js";
import { createCommunity } from "../src/beatcore-people-communities.js";
import { createPlace } from "../src/beatcore-place.js";
import { createContext, createRelationship } from "../src/beatcore-relationship-context.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function baseRepository(): Promise<InMemoryPersistenceRepository> {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, { identityId: id("identity-rc"), kind: "human" });
  await createParticipant(repository, { participantId: id("participant-rc"), identityId: id("identity-rc") });
  await createCommunity(repository, { communityId: id("community-rc"), name: "RC Community" });
  await createPlace(repository, { placeId: id("place-rc"), kind: "PLACE" });
  return repository;
}

test("creates and persists a Relationship with validity", async () => {
  const repository = await baseRepository();
  const relationship = await createRelationship(repository, {
    relationshipId: id("relationship-1"),
    subjectId: id("participant-rc"),
    targetId: id("place-rc"),
    kind: "occupies",
    validFrom: "2026-01-01T00:00:00Z",
    validUntil: "2027-01-01T00:00:00Z"
  });
  assert.equal(relationship.kind, "occupies");
  assert.deepEqual(repository.read("relationships", id("relationship-1")), relationship);
});

test("rejects self-relationships and invalid validity windows", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createRelationship(repository, {
      relationshipId: id("relationship-self"),
      subjectId: id("participant-rc"),
      targetId: id("participant-rc"),
      kind: "self",
      validFrom: "2026-01-01T00:00:00Z"
    }),
    /VALIDATION_FAILURE/
  );
  await assert.rejects(
    createRelationship(repository, {
      relationshipId: id("relationship-invalid-time"),
      subjectId: id("participant-rc"),
      targetId: id("place-rc"),
      kind: "occupies",
      validFrom: "2027-01-01T00:00:00Z",
      validUntil: "2026-01-01T00:00:00Z"
    }),
    /VALIDATION_FAILURE/
  );
});

test("creates Context for a Participant with optional Place and Community", async () => {
  const repository = await baseRepository();
  const context = await createContext(repository, {
    contextId: id("context-1"),
    participantId: id("participant-rc"),
    placeId: id("place-rc"),
    communityId: id("community-rc"),
    purpose: "residency"
  });
  assert.deepEqual(repository.read("contexts", id("context-1")), context);
});

test("Context requires an existing Participant and optional references", async () => {
  const repository = new InMemoryPersistenceRepository();
  await assert.rejects(
    createContext(repository, {
      contextId: id("context-missing"),
      participantId: id("missing-participant")
    }),
    /NOT_FOUND/
  );
});

test("Context rejects missing Place or Community references", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createContext(repository, {
      contextId: id("context-missing-place"),
      participantId: id("participant-rc"),
      placeId: id("missing-place")
    }),
    /NOT_FOUND/
  );
  await assert.rejects(
    createContext(repository, {
      contextId: id("context-missing-community"),
      participantId: id("participant-rc"),
      communityId: id("missing-community")
    }),
    /NOT_FOUND/
  );
});

test("duplicate Relationship and Context IDs conflict", async () => {
  const repository = await baseRepository();
  await createRelationship(repository, {
    relationshipId: id("duplicate-rc"),
    subjectId: id("participant-rc"),
    targetId: id("place-rc"),
    kind: "occupies",
    validFrom: "2026-01-01T00:00:00Z"
  });
  await assert.rejects(
    createRelationship(repository, {
      relationshipId: id("duplicate-rc"),
      subjectId: id("participant-rc"),
      targetId: id("place-rc"),
      kind: "other",
      validFrom: "2026-01-01T00:00:00Z"
    }),
    /CONFLICT/
  );

  await createContext(repository, {
    contextId: id("duplicate-context"),
    participantId: id("participant-rc")
  });
  await assert.rejects(
    createContext(repository, {
      contextId: id("duplicate-context"),
      participantId: id("participant-rc")
    }),
    /CONFLICT/
  );
});

test("Relationship and Context do not create Capability or Authorization", async () => {
  const repository = await baseRepository();
  await createRelationship(repository, {
    relationshipId: id("relationship-no-authority"),
    subjectId: id("participant-rc"),
    targetId: id("place-rc"),
    kind: "occupies",
    validFrom: "2026-01-01T00:00:00Z"
  });
  await createContext(repository, {
    contextId: id("context-no-authority"),
    participantId: id("participant-rc")
  });
  assert.equal(repository.read("capabilities", id("relationship-no-authority")), undefined);
  assert.equal(repository.read("authorizations", id("relationship-no-authority")), undefined);
  assert.equal(repository.read("capabilities", id("context-no-authority")), undefined);
  assert.equal(repository.read("authorizations", id("context-no-authority")), undefined);
});
