import {
  assertAuthorizationForAction,
  assertActionTransition,
  type Authorization,
  type Id,
  type LifecycleState
} from "./beatcore.js";

export type PaymentStatus =
  | "REQUESTED"
  | "AUTHORIZED"
  | "PROCESSING"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "DENIED"
  | "REJECTED"
  | "CANCELLED"
  | "PARTIAL"
  | "UNKNOWN"
  | "REVERSED"
  | "RECONCILIATION_REQUIRED"
  | "RECONCILED";

export interface Payment {
  readonly paymentId: Id;
  readonly payerParticipantId?: Id;
  readonly payeeParticipantId?: Id;
  readonly amount: string;
  readonly currency: string;
  readonly purpose: string;
  readonly status: PaymentStatus;
  readonly actorId: Id;
  readonly authorizationId: Id;
  readonly idempotencyKey: string;
  readonly requestId?: Id;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly externalReference?: {
    readonly provider: string;
    readonly reference: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatePaymentInput {
  readonly paymentId: Id;
  readonly payerParticipantId?: Id;
  readonly payeeParticipantId?: Id;
  readonly amount: string;
  readonly currency: string;
  readonly purpose: string;
  readonly actorId: Id;
  readonly authorization: Authorization;
  readonly idempotencyKey: string;
  readonly requestId?: Id;
  readonly correlationId?: Id;
  readonly causationId?: Id;
  readonly createdAt: string;
  readonly now?: Date;
}

/**
 * Payments-domain implementation only.
 * It is provider-neutral and deliberately does not perform external processing,
 * create payment Events/Evidence, or persist a provider result as completion.
 */
export function createPayment(input: CreatePaymentInput): Payment {
  requireId(input.paymentId);
  requireId(input.actorId);
  requireText(input.purpose);
  requireText(input.idempotencyKey);
  const amount = normalizeAmount(input.amount);
  const currency = normalizeCurrency(input.currency);
  const createdAt = parseTimestamp(input.createdAt);

  assertAuthorizationForAction(input.authorization, input.now);
  if (input.actorId !== input.authorization.actorId) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    paymentId: input.paymentId,
    ...(input.payerParticipantId ? { payerParticipantId: input.payerParticipantId } : {}),
    ...(input.payeeParticipantId ? { payeeParticipantId: input.payeeParticipantId } : {}),
    amount,
    currency,
    purpose: input.purpose.trim(),
    status: "AUTHORIZED",
    actorId: input.actorId,
    authorizationId: input.authorization.id,
    idempotencyKey: input.idempotencyKey.trim(),
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    ...(input.causationId ? { causationId: input.causationId } : {}),
    createdAt,
    updatedAt: createdAt
  };
}

const allowedPaymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  REQUESTED: ["AUTHORIZED", "DENIED", "REJECTED", "CANCELLED"],
  AUTHORIZED: ["PROCESSING", "DENIED", "CANCELLED", "FAILED"],
  PROCESSING: ["COMPLETED", "FAILED", "PARTIAL", "CANCELLED", "UNKNOWN", "PENDING", "RECONCILIATION_REQUIRED"],
  PENDING: ["PROCESSING", "COMPLETED", "FAILED", "UNKNOWN", "RECONCILIATION_REQUIRED", "CANCELLED"],
  COMPLETED: ["REVERSED", "RECONCILIATION_REQUIRED", "RECONCILED"],
  FAILED: ["RECONCILED", "RECONCILIATION_REQUIRED"],
  DENIED: [],
  REJECTED: [],
  CANCELLED: [],
  PARTIAL: ["COMPLETED", "FAILED", "UNKNOWN", "RECONCILIATION_REQUIRED", "RECONCILED"],
  UNKNOWN: ["PROCESSING", "COMPLETED", "FAILED", "RECONCILIATION_REQUIRED", "RECONCILED"],
  REVERSED: ["RECONCILED"],
  RECONCILIATION_REQUIRED: ["COMPLETED", "FAILED", "REVERSED", "RECONCILED"],
  RECONCILED: []
};

export function transitionPayment(
  payment: Payment,
  to: PaymentStatus,
  occurredAt: string
): Payment {
  if (payment.status === to) {
    throw new Error("VALIDATION_FAILURE");
  }

  // Keep the foundational transition validator authoritative where states overlap.
  if (isBeatCoreLifecycle(payment.status) && isBeatCoreLifecycle(to)) {
    try {
      assertActionTransition(payment.status, to);
    } catch {
      // Payment-specific states (for example UNKNOWN) have their own explicit map.
    }
  }

  if (!allowedPaymentTransitions[payment.status].includes(to)) {
    throw new Error("VALIDATION_FAILURE");
  }

  const updatedAt = parseTimestamp(occurredAt);
  return { ...payment, status: to, updatedAt };
}

export interface IntegrationPaymentOutcome {
  readonly outcome: "ACCEPTED" | "REJECTED" | "UNKNOWN";
  readonly externalReference?: { readonly provider: string; readonly reference: string };
  readonly receivedAt: string;
}

export function applyIntegrationOutcome(
  payment: Payment,
  outcome: IntegrationPaymentOutcome
): Payment {
  const receivedAt = parseTimestamp(outcome.receivedAt);

  if (outcome.externalReference) {
    requireText(outcome.externalReference.provider);
    requireText(outcome.externalReference.reference);
  }

  if (outcome.outcome === "UNKNOWN") {
    return transitionPayment(payment, "UNKNOWN", receivedAt);
  }

  if (outcome.outcome === "REJECTED") {
    const next = transitionPayment(payment, "FAILED", receivedAt);
    return outcome.externalReference
      ? { ...next, externalReference: outcome.externalReference }
      : next;
  }

  // External acceptance means processing, never completion.
  const next = transitionPayment(payment, "PROCESSING", receivedAt);
  return outcome.externalReference
    ? { ...next, externalReference: outcome.externalReference }
    : next;
}

function isBeatCoreLifecycle(value: PaymentStatus): value is LifecycleState {
  return value !== "PENDING" &&
    value !== "UNKNOWN" &&
    value !== "RECONCILIATION_REQUIRED";
}

function requireId(value: Id): void {
  if (!value.trim()) throw new Error("INVALID_INPUT");
}

function requireText(value: string): void {
  if (!value.trim()) throw new Error("INVALID_INPUT");
}

function parseTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("INVALID_INPUT");
  return parsed.toISOString();
}

function normalizeCurrency(value: string): string {
  const currency = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("VALIDATION_FAILURE");
  return currency;
}

function normalizeAmount(value: string): string {
  const amount = value.trim();
  if (!/^\\d+(?:\\.\\d+)?$/.test(amount)) throw new Error("VALIDATION_FAILURE");
  const [whole, fraction = ""] = amount.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\\d)/, "");
  const normalized = fraction.length
    ? `${normalizedWhole}.${fraction.replace(/0+$/, "")}`
    : normalizedWhole;

  if (normalized === "0" || normalized === "0.0" || normalized === "0.00") {
    throw new Error("VALIDATION_FAILURE");
  }

  return normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
}
