export const ZALAGREN_PARTICIPATING_ENTITY_KINDS = [
  "human",
  "community",
  "organization",
  "place",
  "physical_asset",
  "service_provider",
  "service",
  "system"
] as const;

export type ZalagrenParticipatingEntityKind =
  typeof ZALAGREN_PARTICIPATING_ENTITY_KINDS[number];

export interface ZalagrenParticipatingEntity {
  readonly id: string;
  readonly kind: ZalagrenParticipatingEntityKind;
  readonly displayName: string;
  /**
   * Participation describes presence in the ecosystem.
   * It never grants authority by itself.
   */
  readonly participation?: {
    readonly contextId?: string;
    readonly relationshipIds?: readonly string[];
  };
}

export interface ZalagrenAuthorityBoundary {
  readonly entityId: string;
  readonly capabilityId: string;
  readonly contextId: string;
  readonly authorizationId: string;
}

/**
 * Canonical rule for the expanded Zalagren entity model:
 * an entity can participate without becoming an authority.
 */
export function isAuthorityBound(
  entity: ZalagrenParticipatingEntity,
  authorization: ZalagrenAuthorityBoundary | undefined
): boolean {
  return Boolean(
    authorization &&
      authorization.entityId === entity.id &&
      authorization.contextId === entity.participation?.contextId &&
      authorization.capabilityId &&
      authorization.authorizationId
  );
}
