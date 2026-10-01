import type { Id } from "./beatcore.js";

export type GenesisOutputKind =
  | "OBSERVATION"
  | "INSIGHT"
  | "KNOWLEDGE"
  | "RECOMMENDATION"
  | "RISK"
  | "PREDICTION"
  | "PROPOSAL";

export interface GenesisInput {
  readonly contextId?: Id;
  readonly sourceIds?: readonly Id[];
  readonly purpose: string;
}

export interface GenesisOutput {
  readonly id: Id;
  readonly kind: GenesisOutputKind;
  readonly summary: string;
  readonly sourceIds: readonly Id[];
  readonly contextId?: Id;
}

const allowedKinds: ReadonlySet<string> = new Set([
  "OBSERVATION",
  "INSIGHT",
  "KNOWLEDGE",
  "RECOMMENDATION",
  "RISK",
  "PREDICTION",
  "PROPOSAL"
]);

function requiredText(value: string): void {
  if (!value.trim()) throw new Error("INVALID_INPUT");
}

export function createGenesisOutput(input: {
  readonly id: Id;
  readonly kind: GenesisOutputKind;
  readonly summary: string;
  readonly sourceIds?: readonly Id[];
  readonly contextId?: Id;
}): GenesisOutput {
  requiredText(input.id);
  requiredText(input.summary);

  if (!allowedKinds.has(input.kind)) {
    throw new Error("VALIDATION_FAILURE");
  }

  const sourceIds = input.sourceIds ?? [];
  for (const sourceId of sourceIds) requiredText(sourceId);

  return {
    id: input.id,
    kind: input.kind,
    summary: input.summary.trim(),
    sourceIds: [...sourceIds],
    ...(input.contextId ? { contextId: input.contextId } : {})
  };
}

export function createGenesisProposalOutput(input: {
  readonly id: Id;
  readonly summary: string;
  readonly sourceIds?: readonly Id[];
  readonly contextId?: Id;
}): GenesisOutput {
  return createGenesisOutput({
    ...input,
    kind: "PROPOSAL"
  });
}
