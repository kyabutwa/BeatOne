import { execFileSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { test } from "node:test";

const url = process.env.DATABASE_URL;
const runtimeTest = url ? test : test.skip;

const psql = (sql: string) =>
  execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-A", "-t", "-c", sql], {
    encoding: "utf8"
  }).trim();

runtimeTest("PostgreSQL Event/Evidence migration rehearsal: legacy conversion, bridge retirement, producer-compatible schema", () => {
  execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-f", "test/fixtures/event-evidence-legacy-postgres-runtime.sql"], { encoding: "utf8" });
  psql("CREATE TABLE zalagren_schema_migrations (id text PRIMARY KEY);");

  psql("INSERT INTO events(id,title,context_id,participant_id,type,source,status,occurred_at) VALUES ('legacy:event','legacy','context:1','participant:1','legacy.type','system','open',now())");
  psql("INSERT INTO evidence(id,status,statement,source,observed_at) VALUES ('legacy:evidence','observed','legacy statement','legacy-source',now())");
  psql("INSERT INTO event_evidence(event_id,evidence_id) VALUES ('legacy:event','legacy:evidence')");
  psql("INSERT INTO action_outcome_trace(execution_id,event_id,evidence_id) VALUES ('execution:legacy','legacy:event','legacy:evidence')");

  assert.throws(() => execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-f", "migrations/023_event_evidence_physical_canonicalization_2026-10-02.sql"], { encoding: "utf8" }));

  psql("TRUNCATE action_outcome_trace, event_evidence, evidence, events");
  psql("DROP TABLE event_evidence");
  psql("CREATE TABLE event_evidence (event_id text NOT NULL REFERENCES events(id), evidence_id text NOT NULL REFERENCES evidence(id), PRIMARY KEY(event_id,evidence_id))");
  psql("DROP TABLE event_evidence");

  execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-f", "migrations/023_event_evidence_physical_canonicalization_2026-10-02.sql"], { encoding: "utf8" });

  const columns = psql("SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='events'");
  assert.equal(columns, "id,action_id,type,state,actor_id,context_id,source,occurred_at,correlation_id,causation_id,version");

  const evidenceColumns = psql("SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='evidence'");
  assert.equal(evidenceColumns, "id,event_id,source,verification,recorded_at,external_provider,external_reference");

  assert.equal(psql("SELECT to_regclass('public.event_evidence') IS NULL"), "t");

  psql("INSERT INTO identities(id) VALUES ('identity:1'); INSERT INTO contexts(id) VALUES ('context:1'); INSERT INTO actions(id) VALUES ('action:1');");
  psql("INSERT INTO events(id,action_id,type,state,actor_id,context_id,source,occurred_at,version) VALUES ('event:1','action:1','canonical.type','AUTHORIZED','identity:1','context:1','system',now(),1)");
  psql("INSERT INTO evidence(id,event_id,source,verification,recorded_at) VALUES ('evidence:1','event:1','canonical-test','UNVERIFIED',now())");

  assert.equal(psql("SELECT action_id || ':' || state || ':' || version FROM events WHERE id='event:1'"), "action:1:AUTHORIZED:1");
  assert.equal(psql("SELECT event_id || ':' || verification FROM evidence WHERE id='evidence:1'"), "event:1:UNVERIFIED");
  assert.equal(psql("SELECT count(*) FROM action_outcome_trace"), "0");
  assert.equal(psql("SELECT id FROM zalagren_schema_migrations WHERE id='023_event_evidence_physical_canonicalization_2026-10-02'"), "023_event_evidence_physical_canonicalization_2026-10-02");
});
