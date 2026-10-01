import type { Community, Id, Person } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredCommunity, StoredPerson } from "./beatcore-persistence.js";

export interface CreatePersonCommand {
  readonly personId: Id;
}

export interface CreateCommunityCommand {
  readonly communityId: Id;
  readonly name: string;
}

export async function createPerson(
  repository: PersistenceRepository,
  command: CreatePersonCommand
): Promise<Person> {
  if (!command.personId.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const person: StoredPerson = { id: command.personId };

  await repository.transaction((tx) => {
    tx.insert("persons", person);
  });

  return person;
}

export async function createCommunity(
  repository: PersistenceRepository,
  command: CreateCommunityCommand
): Promise<Community> {
  if (!command.communityId.trim() || !command.name.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const community: StoredCommunity = {
    id: command.communityId,
    name: command.name.trim()
  };

  await repository.transaction((tx) => {
    tx.insert("communities", community);
  });

  return community;
}
