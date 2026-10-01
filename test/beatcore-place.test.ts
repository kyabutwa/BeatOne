import { strict as assert } from "node:assert";
import { test } from "node:test";
import { id } from "../src/beatcore.js";
import { createPlace } from "../src/beatcore-place.js";
import { InMemoryPersistenceRepository } from "../src/beatcore-repository.js";

test("creates the canonical Place hierarchy", async () => {
  const repository = new InMemoryPersistenceRepository();

  const place = await createPlace(repository, {
    placeId: id("place-1"),
    kind: "PLACE"
  });
  const building = await createPlace(repository, {
    placeId: id("building-1"),
    kind: "BUILDING",
    parentId: place.id
  });
  const floor = await createPlace(repository, {
    placeId: id("floor-1"),
    kind: "FLOOR",
    parentId: building.id
  });
  const unit = await createPlace(repository, {
    placeId: id("unit-1"),
    kind: "UNIT",
    parentId: floor.id
  });
  const resource = await createPlace(repository, {
    placeId: id("resource-1"),
    kind: "RESOURCE",
    parentId: unit.id
  });

  assert.equal(place.kind, "PLACE");
  assert.equal(building.parentId, place.id);
  assert.equal(floor.parentId, building.id);
  assert.equal(unit.parentId, floor.id);
  assert.equal(resource.parentId, unit.id);
  assert.deepEqual(repository.read("places", resource.id), resource);
});

test("allows a root Building without inventing a parent", async () => {
  const repository = new InMemoryPersistenceRepository();

  const building = await createPlace(repository, {
    placeId: id("root-building"),
    kind: "BUILDING"
  });

  assert.equal(building.parentId, undefined);
});

test("rejects an invalid parent kind", async () => {
  const repository = new InMemoryPersistenceRepository();

  const place = await createPlace(repository, {
    placeId: id("place-parent"),
    kind: "PLACE"
  });

  await assert.rejects(
    createPlace(repository, {
      placeId: id("unit-invalid-parent"),
      kind: "UNIT",
      parentId: place.id
    }),
    /VALIDATION_FAILURE/
  );
});

test("rejects missing required parent", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createPlace(repository, {
      placeId: id("floor-no-parent"),
      kind: "FLOOR"
    }),
    /INVALID_INPUT/
  );
});

test("rejects a Place parent", async () => {
  const repository = new InMemoryPersistenceRepository();

  const parent = await createPlace(repository, {
    placeId: id("place-root"),
    kind: "PLACE"
  });

  await assert.rejects(
    createPlace(repository, {
      placeId: id("place-child"),
      kind: "PLACE",
      parentId: parent.id
    }),
    /INVALID_INPUT/
  );
});

test("rejects a missing parent", async () => {
  const repository = new InMemoryPersistenceRepository();

  await assert.rejects(
    createPlace(repository, {
      placeId: id("floor-missing-parent"),
      kind: "FLOOR",
      parentId: id("missing-building")
    }),
    /NOT_FOUND/
  );

  assert.equal(
    repository.read("places", id("floor-missing-parent")),
    undefined
  );
});

test("duplicate Place IDs are conflicts", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createPlace(repository, {
    placeId: id("duplicate-place"),
    kind: "PLACE"
  });

  await assert.rejects(
    createPlace(repository, {
      placeId: id("duplicate-place"),
      kind: "BUILDING"
    }),
    /CONFLICT/
  );
});

test("Place creation does not create Access, Capability, Authorization, or Context", async () => {
  const repository = new InMemoryPersistenceRepository();

  await createPlace(repository, {
    placeId: id("place-no-authority"),
    kind: "BUILDING"
  });

  assert.equal(repository.read("accesses", id("place-no-authority")), undefined);
  assert.equal(repository.read("capabilities", id("place-no-authority")), undefined);
  assert.equal(repository.read("authorizations", id("place-no-authority")), undefined);
  assert.equal(repository.read("contexts", id("place-no-authority")), undefined);
});
