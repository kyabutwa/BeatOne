import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import {
  createCommunity,
  createPerson
} from "../src/beatcore-people-communities.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

test("creates and persists a Person without creating Identity", async () => {
  const repository = new InMemoryPersistenceRepository();

  const person = await createPerson(repository, { personId: id("person-1") });

  assert.deepEqual(person, { id: id("person-1") });
  assert.deepEqual(repository.read("persons", id("person-1")), person);
  assert.equal(repository.read("identities", id("person-1")), undefined);
});

test("creates and persists a Community without creating Participant or Authorization", async () => {
  const repository = new InMemoryPersistenceRepository();

  const community = await createCommunity(repository, {
    communityId: id("community-1"),
    name: "Tsavo"
  });

  assert.deepEqual(community, { id: id("community-1"), name: "Tsavo" });
  assert.deepEqual(repository.read("communities", id("community-1")), community);
  assert.equal(repository.read("participants", id("community-1")), undefined);
  assert.equal(repository.read("authorizations", id("community-1")), undefined);
});

test("rejects empty Person ID", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createPerson(repository, { personId: "" as ReturnType<typeof id> }),
    /INVALID_INPUT/
  );
});

test("rejects empty Community ID or name", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createCommunity(repository, {
      communityId: "" as ReturnType<typeof id>,
      name: "Community"
    }),
    /INVALID_INPUT/
  );

  await assert.rejects(
    createCommunity(repository, {
      communityId: id("community-2"),
      name: "   "
    }),
    /INVALID_INPUT/
  );
});

test("duplicate Person and Community IDs are conflicts", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createPerson(repository, { personId: id("person-2") });
  await assert.rejects(
    createPerson(repository, { personId: id("person-2") }),
    /CONFLICT/
  );

  await createCommunity(repository, {
    communityId: id("community-2"),
    name: "Community"
  });
  await assert.rejects(
    createCommunity(repository, {
      communityId: id("community-2"),
      name: "Other"
    }),
    /CONFLICT/
  );
});

test("failed transaction does not publish a partial Person or Community", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    repository.transaction((tx) => {
      tx.insert("persons", { id: id("person-3") });
      tx.insert("communities", { id: id("community-3"), name: "" });
    }),
    /INVALID_INPUT/
  );

  assert.equal(repository.read("persons", id("person-3")), undefined);
  assert.equal(repository.read("communities", id("community-3")), undefined);
});
