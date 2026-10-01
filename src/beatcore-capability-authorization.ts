import type { Authorization, Capability, Id } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredAuthorization, StoredCapability } from "./beatcore-persistence.js";

export interface CreateCapabilityCommand {
  readonly capabilityId: Id;
  readonly name: string;
}

export interface CreateAuthorizationCommand {
  readonly authorizationId: Id;
  readonly decision: Authorization["decision"];
  readonly actorId: Id;
  readonly participantId?: Id;
  readonly contextId?: Id;
  readonly relationshipId?: Id;
  readonly capabilityId: Id;
  readonly validFrom: string;
  readonly validUntil?: string;
  readonly scope?: string;
  readonly delegatedBy?: Id;
}

function parseTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_INPUT");
  return parsed.toISOString();
}

export async function createCapability(
  repository: PersistenceRepository,
  command: CreateCapabilityCommand
): Promise<Capability> {
  if (!command.capabilityId.trim() || !command.name.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const capability: StoredCapability = {
    id: command.capabilityId,
    name: command.name.trim()
  };

  await repository.transaction((tx) => tx.insert("capabilities", capability));
  return capability;
}

export async function createAuthorization(
  repository: PersistenceRepository,
  command: CreateAuthorizationCommand
): Promise<Authorization> {
  if (
    !command.authorizationId.trim() ||
    !command.actorId.trim() ||
    !command.capabilityId.trim()
  ) {
    throw new Error("INVALID_INPUT");
  }

  const validFrom = parseTimestamp(command.validFrom);
  const validUntil = command.validUntil
    ? parseTimestamp(command.validUntil)
    : undefined;

  if (validUntil && new Date(validUntil) <= new Date(validFrom)) {
    throw new Error("VALIDATION_FAILURE");
  }

  if (command.scope !== undefined && !command.scope.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const authorization: StoredAuthorization = {
    id: command.authorizationId,
    decision: command.decision,
    actorId: command.actorId,
    capabilityId: command.capabilityId,
    validFrom,
    ...(command.participantId ? { participantId: command.participantId } : {}),
    ...(command.contextId ? { contextId: command.contextId } : {}),
    ...(command.relationshipId ? { relationshipId: command.relationshipId } : {}),
    ...(validUntil ? { validUntil } : {}),
    ...(command.scope ? { scope: command.scope.trim() } : {}),
    ...(command.delegatedBy ? { delegatedBy: command.delegatedBy } : {})
  };

  await repository.transaction((tx) => tx.insert("authorizations", authorization));
  return authorization;
}
