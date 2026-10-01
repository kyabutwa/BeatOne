import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import {
  createIdentity,
  createParticipant
} from "../src/beatcore-identity-participant.js";
import {
  createCommunity,
  createPerson
} from "../src/beatcore-people-communities.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

test("creates a human Identity linked to an existing Person", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createPerson(repository, { personId: id("person-identity-1") });

  const identity = await createIdentity(repository, {
    identityId: id("identity-1"),
    kind: "human",
    personId: id("person-identity-1")
  });

  assert.deepEqual(identity, {
    id: id("identity-1"),
    kind: "human",
    personId: id("person-identity-1")
  });
  assert.deepEqual(
    repository.read("identities", id("identity-1")),
    identity
  );
});

test("creates a non-human Identity without creating a Person", async () => {
  const repository = new InMemoryPersistenceRepository();

  const identity = await createIdentity(repository, {
    identityId: id("identity-service-1"),
    kind: "service"
  });

  assert.deepEqual(identity, {
    id: id("identity-service-1"),
    kind: "service"
  });
  assert.equal(repository.read("persons", id("identity-service-1")), undefined);
});

test("rejects an Identity linked to a missing Person", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createIdentity(repository, {
      identityId: id("identity-missing-person"),
      kind: "human",
      personId: id("person-missing")
    }),
    /NOT_FOUND/
  );

  assert.equal(
    repository.read("identities", id("identity-missing-person")),
    undefined
  );
});

test("duplicate Identity IDs are conflicts", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-duplicate"),
    kind: "service"
  });

  await assert.rejects(
    createIdentity(repository, {
      identityId: id("identity-duplicate"),
      kind: "system"
    }),
    /CONFLICT/
  );
});

test("creates a Participant for an existing Identity", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-participant-1"),
    kind: "human"
  });

  const participant = await createParticipant(repository, {
    participantId: id("participant-1"),
    identityId: id("identity-participant-1")
  });

  assert.deepEqual(participant, {
    id: id("participant-1"),
    identityId: id("identity-participant-1")
  });
  assert.deepEqual(
    repository.read("participants", id("participant-1")),
    participant
  );
});

test("creates a Participant associated with an existing Community", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-participant-2"),
    kind: "human"
  });
  await createCommunity(repository, {
    communityId: id("community-participant-1"),
    name: "Community"
  });

  const participant = await createParticipant(repository, {
    participantId: id("participant-2"),
    identityId: id("identity-participant-2"),
    communityId: id("community-participant-1")
  });

  assert.deepEqual(participant, {
    id: id("participant-2"),
    identityId: id("identity-participant-2"),
    communityId: id("community-participant-1")
  });
});

test("rejects a Participant with a missing Identity", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createParticipant(repository, {
      participantId: id("participant-missing-identity"),
      identityId: id("identity-missing")
    }),
    /NOT_FOUND/
  );

  assert.equal(
    repository.read("participants", id("participant-missing-identity")),
    undefined
  );
});

test("rejects a Participant with a missing Community", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-participant-3"),
    kind: "human"
  });

  await assert.rejects(
    createParticipant(repository, {
      participantId: id("participant-missing-community"),
      identityId: id("identity-participant-3"),
      communityId: id("community-missing")
    }),
    /NOT_FOUND/
  );
});

test("duplicate Participant IDs are conflicts", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-participant-4"),
    kind: "human"
  });

  await createParticipant(repository, {
    participantId: id("participant-duplicate"),
    identityId: id("identity-participant-4")
  });

  await assert.rejects(
    createParticipant(repository, {
      participantId: id("participant-duplicate"),
      identityId: id("identity-participant-4")
    }),
    /CONFLICT/
  );
});

test("Identity and Participant creation do not create Account, Credential, Session, or Authorization", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createIdentity(repository, {
    identityId: id("identity-no-auth"),
    kind: "human"
  });
  await createParticipant(repository, {
    participantId: id("participant-no-auth"),
    identityId: id("identity-no-auth")
  });

  assert.equal(repository.read("accounts", id("identity-no-auth")), undefined);
  assert.equal(repository.read("credentials", id("identity-no-auth")), undefined);
  assert.equal(repository.read("sessions", id("identity-no-auth")), undefined);
  assert.equal(
    repository.read("authorizations", id("identity-no-auth")),
    undefined
  );
});
