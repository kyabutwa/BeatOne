import type { Access, Id } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredAccess } from "./beatcore-persistence.js";

export interface CreateAccessCommand {
  readonly accessId: Id;
  readonly participantId: Id;
  readonly targetType: Access["targetType"];
  readonly targetId: Id;
  readonly mode: Access["mode"];
}

export async function createAccess(
  repository: PersistenceRepository,
  command: CreateAccessCommand
): Promise<Access> {
  if (
    !command.accessId.trim() ||
    !command.participantId.trim() ||
    !command.targetId.trim()
  ) {
    throw new Error("INVALID_INPUT");
  }

  const access: StoredAccess = {
    id: command.accessId,
    participantId: command.participantId,
    targetType: command.targetType,
    targetId: command.targetId,
    mode: command.mode
  };

  await repository.transaction((tx) => {
    tx.insert("accesses", access);
  });

  return access;
}
