import type { Context, Id, Relationship } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredContext, StoredRelationship } from "./beatcore-persistence.js";

export interface CreateRelationshipCommand {
  readonly relationshipId: Id;
  readonly subjectId: Id;
  readonly targetId: Id;
  readonly kind: string;
  readonly validFrom: string;
  readonly validUntil?: string;
}

export interface CreateContextCommand {
  readonly contextId: Id;
  readonly participantId: Id;
  readonly placeId?: Id;
  readonly communityId?: Id;
  readonly purpose?: string;
}

const timestamp = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_INPUT");
  return parsed.toISOString();
};

export async function createRelationship(
  repository: PersistenceRepository,
  command: CreateRelationshipCommand
): Promise<Relationship> {
  if (!command.relationshipId.trim() || !command.subjectId.trim() || !command.targetId.trim() || !command.kind.trim()) {
    throw new Error("INVALID_INPUT");
  }
  if (command.subjectId === command.targetId) throw new Error("VALIDATION_FAILURE");
  const validFrom = timestamp(command.validFrom);
  const validUntil = command.validUntil ? timestamp(command.validUntil) : undefined;
  if (validUntil && new Date(validUntil) <= new Date(validFrom)) throw new Error("VALIDATION_FAILURE");

  const relationship: StoredRelationship = {
    id: command.relationshipId,
    subjectId: command.subjectId,
    targetId: command.targetId,
    kind: command.kind.trim(),
    validFrom,
    ...(validUntil ? { validUntil } : {})
  };
  await repository.transaction((tx) => tx.insert("relationships", relationship));
  return relationship;
}

export async function createContext(
  repository: PersistenceRepository,
  command: CreateContextCommand
): Promise<Context> {
  if (!command.contextId.trim() || !command.participantId.trim()) throw new Error("INVALID_INPUT");
  if (command.purpose !== undefined && !command.purpose.trim()) throw new Error("INVALID_INPUT");

  const context: StoredContext = {
    id: command.contextId,
    participantId: command.participantId,
    ...(command.placeId ? { placeId: command.placeId } : {}),
    ...(command.communityId ? { communityId: command.communityId } : {}),
    ...(command.purpose ? { purpose: command.purpose.trim() } : {})
  };
  await repository.transaction((tx) => tx.insert("contexts", context));
  return context;
}
