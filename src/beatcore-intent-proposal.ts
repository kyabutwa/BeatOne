import type { Id, Intent, Proposal } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredIntent, StoredProposal } from "./beatcore-persistence.js";

export interface CreateIntentCommand {
  readonly intentId: Id;
  readonly actorId: Id;
  readonly purpose: string;
  readonly contextId?: Id;
}

export interface CreateProposalCommand {
  readonly proposalId: Id;
  readonly actorId: Id;
  readonly intentId: Id;
  readonly summary: string;
  readonly authorizationId?: Id;
}

export async function createIntent(
  repository: PersistenceRepository,
  command: CreateIntentCommand
): Promise<Intent> {
  if (!command.intentId.trim() || !command.actorId.trim() || !command.purpose.trim()) {
    throw new Error("INVALID_INPUT");
  }

  const intent: StoredIntent = {
    id: command.intentId,
    actorId: command.actorId,
    purpose: command.purpose.trim(),
    ...(command.contextId ? { contextId: command.contextId } : {})
  };

  await repository.transaction((tx) => tx.insert("intents", intent));
  return intent;
}

export async function createProposal(
  repository: PersistenceRepository,
  command: CreateProposalCommand
): Promise<Proposal> {
  if (
    !command.proposalId.trim() ||
    !command.actorId.trim() ||
    !command.intentId.trim() ||
    !command.summary.trim()
  ) {
    throw new Error("INVALID_INPUT");
  }

  const proposal: StoredProposal = {
    id: command.proposalId,
    actorId: command.actorId,
    intentId: command.intentId,
    summary: command.summary.trim(),
    ...(command.authorizationId ? { authorizationId: command.authorizationId } : {})
  };

  await repository.transaction((tx) => tx.insert("proposals", proposal));
  return proposal;
}
