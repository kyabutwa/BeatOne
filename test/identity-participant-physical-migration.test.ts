import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../migrations/identity-participant-physical-canonicalization-2026-10-02.sql", import.meta.url),
  "utf8"
);

test("Identity/Participant physical migration is narrowly canonical", () => {
  assert.match(migration, /ALTER TABLE public\.identities/);
  assert.match(migration, /ADD COLUMN kind text NOT NULL/);
  assert.match(migration, /ADD COLUMN person_id text/);
  assert.match(migration, /identities_kind_check/);

  assert.match(migration, /ALTER TABLE public\.participants/);
  assert.match(migration, /ADD COLUMN identity_id text NOT NULL/);
  assert.match(migration, /ADD COLUMN community_id text/);
  assert.match(migration, /ADD COLUMN context_id text/);

  assert.match(migration, /participants_identity_id_fkey/);
  assert.match(migration, /participants_community_id_fkey/);
  assert.match(migration, /participants_context_id_fkey/);

  assert.match(migration, /DROP COLUMN IF EXISTS participant_id/);
  assert.match(migration, /DROP COLUMN IF EXISTS display_name/);
  assert.match(migration, /DROP COLUMN IF EXISTS status/);
  assert.match(migration, /DROP COLUMN IF EXISTS created_at/);

  assert.doesNotMatch(migration, /CREATE TABLE/i);
  assert.doesNotMatch(migration, /DROP TABLE/i);
  assert.doesNotMatch(migration, /INSERT INTO/i);
  assert.doesNotMatch(migration, /DELETE FROM/i);
  assert.doesNotMatch(migration, /UPDATE /i);
});

test("Identity/Participant physical migration has an explicit zero-data safety property", () => {
  assert.match(
    migration,
    /adding these required canonical columns without defaults intentionally fails/
  );
  assert.match(migration, /BEGIN;/);
  assert.match(migration, /COMMIT;/);
});
