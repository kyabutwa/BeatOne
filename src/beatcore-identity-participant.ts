import type {
  Identity,
  Id,
  Participant
} from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type {
  StoredIdentity,
  StoredParticipant
} from "./beatcore-persistence.js";

export interface CreateIdentityCommand {
  readonly identityId: Id;
  readonly kind: Identity["kind"];
  readonly personId?: Id;
}

export interface CreateParticipantCommand {
  readonly participantId: Id;
  readonly identityId: Id;
  readonly communityId?: Id;
  readonly contextId?: Id;
}

export async function createIdentity(
  repository: PersistenceRepository,
  command: CreateIdentityCommand
): Promise<Identity> {
  if (!command.identityId.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const identity: StoredIdentity = {
    id: command.identityId,
    kind: command.kind,
    ...(command.personId ? { personId: command.personId } : {})
  };

  await repository.transaction((tx) => {
    tx.insert("identities", identity);
  });

  return identity;
}

export async function createParticipant(
  repository: PersistenceRepository,
  command: CreateParticipantCommand
): Promise<Participant> {
  if (!command.participantId.trim() || !command.identityId.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const participant: StoredParticipant = {
    id: command.participantId,
    identityId: command.identityId,
    ...(command.communityId ? { communityId: command.communityId } : {}),
    ...(command.contextId ? { contextId: command.contextId } : {})
  };

  await repository.transaction((tx) => {
    tx.insert("participants", participant);
  });

  return participant;
}
