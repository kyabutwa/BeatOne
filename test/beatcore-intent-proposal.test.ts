import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createCapability, createAuthorization } from "../src/beatcore-capability-authorization.js";
import { createIdentity, createParticipant } from "../src/beatcore-identity-participant.js";
import { createCommunity } from "../src/beatcore-people-communities.js";
import { createPlace } from "../src/beatcore-place.js";
import { createContext } from "../src/beatcore-relationship-context.js";
import { createIntent, createProposal } from "../src/beatcore-intent-proposal.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

async function baseRepository(): Promise<InMemoryPersistenceRepository> {
  const repository = new InMemoryPersistenceRepository();
  await createIdentity(repository, { identityId: id("identity-intent"), kind: "human" });
  await createParticipant(repository, { participantId: id("participant-intent"), identityId: id("identity-intent") });
  await createCommunity(repository, { communityId: id("community-intent"), name: "Intent Community" });
  await createPlace(repository, { placeId: id("place-intent"), kind: "PLACE" });
  await createContext(repository, {
    contextId: id("context-intent"),
    participantId: id("participant-intent"),
    placeId: id("place-intent"),
    communityId: id("community-intent"),
    purpose: "test"
  });
  await createCapability(repository, { capabilityId: id("capability-intent"), name: "test-operation" });
  await createAuthorization(repository, {
    authorizationId: id("authorization-intent"),
    decision: "ALLOW",
    actorId: id("identity-intent"),
    capabilityId: id("capability-intent"),
    validFrom: "2026-01-01T00:00:00Z"
  });
  return repository;
}

test("creates and persists Intent", async () => {
  const repository = await baseRepository();
  const intent = await createIntent(repository, {
    intentId: id("intent-1"),
    actorId: id("identity-intent"),
    purpose: "request access",
    contextId: id("context-intent")
  });
  assert.deepEqual(repository.read("intents", id("intent-1")), intent);
});

test("Intent requires an existing actor and optional Context", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createIntent(repository, {
      intentId: id("intent-missing-actor"),
      actorId: id("missing"),
      purpose: "request"
    }),
    /NOT_FOUND/
  );
  await assert.rejects(
    createIntent(repository, {
      intentId: id("intent-missing-context"),
      actorId: id("identity-intent"),
      purpose: "request",
      contextId: id("missing-context")
    }),
    /NOT_FOUND/
  );
});

test("creates Proposal with or without Authorization", async () => {
  const repository = await baseRepository();
  await createIntent(repository, {
    intentId: id("intent-for-proposal"),
    actorId: id("identity-intent"),
    purpose: "proposal source"
  });
  const openIntent = await createIntent(repository, {
    intentId: id("intent-for-proposal"),
    actorId: id("identity-intent"),
    purpose: "open proposal"
  });
  const withoutAuthorization = await createProposal(repository, {
    proposalId: id("proposal-open"),
    actorId: id("identity-intent"),
    intentId: openIntent.id,
    summary: "proposed operation"
  });
  assert.equal(withoutAuthorization.authorizationId, undefined);

  const intent = await createIntent(repository, {
    intentId: id("intent-authorized"),
    actorId: id("identity-intent"),
    purpose: "authorized proposal"
  });
  const withAuthorization = await createProposal(repository, {
    proposalId: id("proposal-authorized"),
    actorId: id("identity-intent"),
    intentId: intent.id,
    summary: "authorized proposal",
    authorizationId: id("authorization-intent")
  });
  assert.equal(withAuthorization.authorizationId, id("authorization-intent"));
});

test("Proposal requires an existing Intent and optional Authorization", async () => {
  const repository = await baseRepository();
  await assert.rejects(
    createProposal(repository, {
      proposalId: id("proposal-missing-intent"),
      actorId: id("identity-intent"),
      intentId: id("missing-intent"),
      summary: "proposal"
    }),
    /NOT_FOUND/
  );
  await assert.rejects(
    createProposal(repository, {
      proposalId: id("proposal-missing-auth"),
      actorId: id("identity-intent"),
      intentId: id("intent-missing-auth"),
      summary: "proposal",
      authorizationId: id("missing-auth")
    }),
    /NOT_FOUND/
  );
});

test("Proposal authorization must belong to the same actor", async () => {
  const repository = await baseRepository();
  await createIdentity(repository, { identityId: id("other-actor"), kind: "human" });
  const intent = await createIntent(repository, {
    intentId: id("intent-mismatch"),
    actorId: id("identity-intent"),
    purpose: "proposal"
  });
  await assert.rejects(
    createProposal(repository, {
      proposalId: id("proposal-mismatch"),
      actorId: id("other-actor"),
      intentId: intent.id,
      summary: "proposal",
      authorizationId: id("authorization-intent")
    }),
    /UNAUTHORIZED/
  );
});

test("duplicate Intent and Proposal IDs conflict", async () => {
  const repository = await baseRepository();
  await createIntent(repository, {
    intentId: id("duplicate-intent"),
    actorId: id("identity-intent"),
    purpose: "one"
  });
  await assert.rejects(
    createIntent(repository, {
      intentId: id("duplicate-intent"),
      actorId: id("identity-intent"),
      purpose: "two"
    }),
    /CONFLICT/
  );

  await createProposal(repository, {
    proposalId: id("duplicate-proposal"),
    actorId: id("identity-intent"),
    intentId: id("duplicate-intent"),
    summary: "one"
  });
  await assert.rejects(
    createProposal(repository, {
      proposalId: id("duplicate-proposal"),
      actorId: id("identity-intent"),
      intentId: id("duplicate-intent"),
      summary: "two"
    }),
    /CONFLICT/
  );
});

test("Intent and Proposal do not create Actions or Events", async () => {
  const repository = await baseRepository();
  const intent = await createIntent(repository, {
    intentId: id("intent-boundary"),
    actorId: id("identity-intent"),
    purpose: "propose only"
  });
  await createProposal(repository, {
    proposalId: id("proposal-boundary"),
    actorId: id("identity-intent"),
    intentId: intent.id,
    summary: "proposal only"
  });
  assert.equal(repository.read("actions", id("proposal-boundary")), undefined);
  assert.equal(repository.read("events", id("proposal-boundary")), undefined);
});
