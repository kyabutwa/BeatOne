import type { Id } from "./beatcore.js";

export type ConstantynaPlan = "normal" | "plus" | "premium";

export type ConstantynaIntent =
  | "EXPLAIN"
  | "NAVIGATE"
  | "DISCOVER"
  | "COMPARE"
  | "OPPORTUNITY"
  | "COMMUNITY"
  | "EXECUTE"
  | "RESEARCH";

export type ConstantynaActionRisk = "none" | "low" | "medium" | "high";

export interface ConstantynaCapability {
  readonly code: string;
  readonly description: string;
  readonly minimumPlan: ConstantynaPlan;
  readonly risk: ConstantynaActionRisk;
  readonly requiresConfirmation: boolean;
}

export interface ConstantynaContext {
  readonly participantId: Id;
  readonly plan: ConstantynaPlan;
  readonly activeCommunityCount: number;
  readonly serviceCount: number;
  readonly capabilityCount: number;
}

export interface ConstantynaAction {
  readonly code: string;
  readonly label: string;
  readonly risk: ConstantynaActionRisk;
  readonly requiresConfirmation: boolean;
  readonly target?: string;
  readonly payload?: Record<string, unknown>;
}

const rank: Record<ConstantynaPlan, number> = { normal: 0, plus: 1, premium: 2 };

export const CONSTANTYNA_CAPABILITIES: readonly ConstantynaCapability[] = [
  { code: "explain_zalagren", description: "Explain Zalagren, its architecture, services, capabilities and limits.", minimumPlan: "normal", risk: "none", requiresConfirmation: false },
  { code: "navigate", description: "Open the correct Zalagren interface or surface.", minimumPlan: "normal", risk: "none", requiresConfirmation: false },
  { code: "discover", description: "Find available communities, places, services and participation opportunities.", minimumPlan: "normal", risk: "none", requiresConfirmation: false },
  { code: "compare", description: "Compare available Zalagren options using available evidence.", minimumPlan: "normal", risk: "none", requiresConfirmation: false },
  { code: "community_guidance", description: "Explain why a community is or is not available and guide onboarding or joining.", minimumPlan: "normal", risk: "none", requiresConfirmation: false },
  { code: "opportunity_scan", description: "Scan current Zalagren data for actionable opportunities and missing-data explanations.", minimumPlan: "plus", risk: "none", requiresConfirmation: false },
  { code: "research", description: "Use an enabled external research connector and clearly separate external evidence from Zalagren facts.", minimumPlan: "plus", risk: "none", requiresConfirmation: false },
  { code: "proposal", description: "Prepare a governed action/proposal for the participant.", minimumPlan: "plus", risk: "low", requiresConfirmation: true },
  { code: "orchestration", description: "Coordinate eligible multi-step Zalagren workflows.", minimumPlan: "premium", risk: "medium", requiresConfirmation: true },
  { code: "consequential_action", description: "Execute an eligible consequential action only after authorization and confirmation.", minimumPlan: "premium", risk: "high", requiresConfirmation: true }
];

export function hasConstantynaCapability(plan: ConstantynaPlan, code: string): boolean {
  const capability = CONSTANTYNA_CAPABILITIES.find(x => x.code === code);
  return Boolean(capability && rank[plan] >= rank[capability.minimumPlan]);
}

export function normalizeConstantynaPlan(value: unknown): ConstantynaPlan {
  const v = String(value ?? "").toLowerCase();
  return v === "premium" || v === "plus" ? v : "normal";
}

export function classifyConstantynaIntent(message: string): ConstantynaIntent {
  const q = message.trim().toLowerCase();
  if (/(research|web|internet|source|latest|look up|find out)/.test(q)) return "RESEARCH";
  if (/(compare|difference|versus| vs\.? |which options)/.test(q)) return "COMPARE";
  if (/(opportunit|available for me|what can i do|what should i|next step)/.test(q)) return "OPPORTUNITY";
  if (/(community|join|onboard|estate|hospital|university|organization)/.test(q)) return "COMMUNITY";
  if (/(execute|do it|create|send|request|book|invite|submit|pay|approve)/.test(q)) return "EXECUTE";
  if (/(open|take me|show me|go to|bring me)/.test(q)) return "NAVIGATE";
  if (/(find|search|available|where can|who can|doctor|medicine|ride|food|service)/.test(q)) return "DISCOVER";
  return "EXPLAIN";
}

export function capabilityForIntent(intent: ConstantynaIntent): string {
  switch (intent) {
    case "RESEARCH": return "research";
    case "COMPARE": return "compare";
    case "OPPORTUNITY": return "opportunity_scan";
    case "COMMUNITY": return "community_guidance";
    case "EXECUTE": return "consequential_action";
    case "NAVIGATE": return "navigate";
    case "DISCOVER": return "discover";
    default: return "explain_zalagren";
  }
}

export function buildConstantynaSystemContext(context: ConstantynaContext): string {
  return [
    "You are CONSTANTYNA, Zalagren's governed intelligence and guidance layer.",
    "You understand Zalagren as coordination infrastructure, not as a property manager, wallet, government, biometric database, marketplace, hospital, or transport operator.",
    "Canonical chain: Identity -> Participant -> Community -> Place -> Relationship -> Capability -> Authorization -> Intent -> Proposal -> Action -> Event -> Evidence.",
    "Never invent a community, provider, availability, authority, payment, verification, action, event, evidence, integration or result.",
    "Always distinguish FACT, CONTEXT, RECOMMENDATION, PROPOSAL and AUTHORIZED ACTION.",
    "Authentication never implies authorization. Participation never grants authority.",
    "When information is absent, explain the concrete reason and the next available path instead of pretending it exists.",
    "You may guide, compare, research through enabled connectors, open interfaces and prepare proposals. Consequential actions require the participant's authorization and the applicable Zalagren capability.",
    `Current participant plan: ${context.plan}.`,
    `Current community count: ${context.activeCommunityCount}; service count: ${context.serviceCount}; capability count: ${context.capabilityCount}.`
  ].join("\n");
}
