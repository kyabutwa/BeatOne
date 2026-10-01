import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createAccess } from "../src/beatcore-access.js";
import { createIdentity, createParticipant } from "../src/beatcore-identity-participant.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function participantRepository(): Promise<InMemoryPersistenceRepository> {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, {
    identityId: id("identity-access-1"),
    kind: "human"
  });
  await createParticipant(repository, {
    participantId: id("participant-access-1"),
    identityId: id("identity-access-1")
  });
  return repository;
}

test("creates and persists a physical Access interaction", async () => {
  const repository = await participantRepository();

  const access = await createAccess(repository, {
    accessId: id("access-1"),
    participantId: id("participant-access-1"),
    targetType: "building",
    targetId: id("building-1"),
    mode: "physical"
  });

  assert.deepEqual(access, {
    id: id("access-1"),
    participantId: id("participant-access-1"),
    targetType: "building",
    targetId: id("building-1"),
    mode: "physical"
  });
  assert.deepEqual(repository.read("accesses", id("access-1")), access);
});

test("supports digital, service, resource, contextual, temporary, and delegated modes", async () => {
  const repository = await participantRepository();
  const modes = [
    "digital",
    "service",
    "resource",
    "contextual",
    "temporary",
    "delegated"
  ] as const;

  for (const [index, mode] of modes.entries()) {
    const access = await createAccess(repository, {
      accessId: id(`access-mode-${index}`),
      participantId: id("participant-access-1"),
      targetType: mode === "service" ? "service" : mode === "digital" ? "digital" : "resource",
      targetId: id(`target-${index}`),
      mode
    });
    assert.equal(access.mode, mode);
  }
});

test("rejects Access with a missing Participant", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createAccess(repository, {
      accessId: id("access-missing-participant"),
      participantId: id("participant-missing"),
      targetType: "building",
      targetId: id("building-1"),
      mode: "physical"
    }),
    /NOT_FOUND/
  );

  assert.equal(
    repository.read("accesses", id("access-missing-participant")),
    undefined
  );
});

test("duplicate Access IDs are conflicts", async () => {
  const repository = await participantRepository();

  await createAccess(repository, {
    accessId: id("access-duplicate"),
    participantId: id("participant-access-1"),
    targetType: "unit",
    targetId: id("unit-1"),
    mode: "physical"
  });

  await assert.rejects(
    createAccess(repository, {
      accessId: id("access-duplicate"),
      participantId: id("participant-access-1"),
      targetType: "unit",
      targetId: id("unit-2"),
      mode: "physical"
    }),
    /CONFLICT/
  );
});

test("Access does not create Authorization or Capability", async () => {
  const repository = await participantRepository();

  await createAccess(repository, {
    accessId: id("access-no-authority"),
    participantId: id("participant-access-1"),
    targetType: "resource",
    targetId: id("resource-1"),
    mode: "resource"
  });

  assert.equal(repository.read("authorizations", id("access-no-authority")), undefined);
  assert.equal(repository.read("capabilities", id("access-no-authority")), undefined);
});
