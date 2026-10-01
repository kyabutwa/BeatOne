import type { Id, Place } from "./beatcore.js";
import type { PersistenceRepository } from "./beatcore-repository.js";
import type { StoredPlace } from "./beatcore-persistence.js";

export interface CreatePlaceCommand {
  readonly placeId: Id;
  readonly kind: Place["kind"];
  readonly parentId?: Id;
}

const expectedParentKind: Record<Exclude<Place["kind"], "PLACE">, Place["kind"] | undefined> = {
  BUILDING: "PLACE",
  FLOOR: "BUILDING",
  UNIT: "FLOOR",
  RESOURCE: "UNIT"
};

export async function createPlace(
  repository: PersistenceRepository,
  command: CreatePlaceCommand
): Promise<Place> {
  if (!command.placeId.trim()) {
    throw new Error("INVALID_INPUT");
  }

  if (command.kind === "PLACE" && command.parentId) {
    throw new Error("INVALID_INPUT");
  }

  const requiresParent = command.kind !== "PLACE" && command.kind !== "BUILDING";
  if (requiresParent && !command.parentId) {
    throw new Error("INVALID_INPUT");
  }

  if (command.parentId === command.placeId) {
    throw new Error("VALIDATION_FAILURE");
  }

  if (command.parentId) {
    const parent = repository.read("places", command.parentId);
    if (!parent) {
      throw new Error("NOT_FOUND");
    }

    const expected = expectedParentKind[command.kind as Exclude<Place["kind"], "PLACE">];
    if (expected && parent.kind !== expected) {
      throw new Error("VALIDATION_FAILURE");
    }
  }

  const place: StoredPlace = {
    id: command.placeId,
    kind: command.kind,
    ...(command.parentId ? { parentId: command.parentId } : {})
  };

  await repository.transaction((tx) => {
    tx.insert("places", place);
  });

  return place;
}
