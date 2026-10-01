import { execFileSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { test } from "node:test";

const url = process.env.DATABASE_URL;
const runtimeTest = url ? test : test.skip;

const psql = (sql: string) =>
  execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-A", "-t", "-c", sql], {
    encoding: "utf8"
  }).trim();

runtimeTest("PostgreSQL Event/Evidence runtime: integrity, CAS, linkage, rollback", () => {
  execFileSync("psql", [url!, "-v", "ON_ERROR_STOP=1", "-X", "-f", "test/fixtures/event-evidence-postgres-runtime.sql"], {
    encoding: "utf8"
  });

  psql(`
    INSERT INTO identities(id) VALUES ('identity:event-test');
    INSERT INTO participants(id) VALUES ('participant:event-test');
    INSERT INTO contexts(id,participant_id,purpose) VALUES ('context:event-test','participant:event-test','event runtime test');
    INSERT INTO authorizations(id,actor_id) VALUES ('authorization:event-test','identity:event-test');
    INSERT INTO actions(id,actor_id,authorization_id,state,operation,context_id)
      VALUES ('action:event-test','identity:event-test','authorization:event-test','AUTHORIZED','event.runtime.test','context:event-test');
  `);

  psql(`
    INSERT INTO events(id,action_id,type,occurred_at,state,actor_id,context_id,source,correlation_id,causation_id,version)
      VALUES ('event:test','action:event-test','action.authorized',now(),'AUTHORIZED','identity:event-test','context:event-test','system','correlation:event-test','action:event-test',1);
    INSERT INTO evidence(id,event_id,source,verification,recorded_at)
      VALUES ('evidence:test','event:test','controlled-postgres-test','UNVERIFIED',now());
  `);

  assert.equal(psql("SELECT count(*) FROM events WHERE id='event:test'"), "1");
  assert.equal(psql("SELECT action_id || ':' || actor_id || ':' || context_id FROM events WHERE id='event:test'"),
    "action:event-test:identity:event-test:context:event-test");
  assert.equal(psql("SELECT event_id || ':' || verification FROM evidence WHERE id='evidence:test'"),
    "event:test:UNVERIFIED");

  assert.throws(() => psql(`
    INSERT INTO events(id,action_id,type,occurred_at,state,actor_id,context_id,source,version)
      VALUES ('event:missing-action','action:missing','bad',now(),'AUTHORIZED','identity:event-test','context:event-test','system',1);
  `));

  assert.throws(() => psql(`
    INSERT INTO evidence(id,event_id,source,verification,recorded_at)
      VALUES ('evidence:missing-event','event:missing','test','UNVERIFIED',now());
  `));

  assert.throws(() => psql(`
    INSERT INTO evidence(id,event_id,source,verification,recorded_at,external_provider)
      VALUES ('evidence:provider-only','event:test','test','UNVERIFIED',now(),'provider');
  `));

  psql("UPDATE events SET state='PROCESSING', version=2 WHERE id='event:test' AND version=1");
  assert.equal(psql("SELECT state || ':' || version FROM events WHERE id='event:test'"), "PROCESSING:2");
  assert.equal(psql("UPDATE events SET state='COMPLETED', version=3 WHERE id='event:test' AND version=1 RETURNING id"),
    "UPDATE 0");
  assert.equal(psql("SELECT state || ':' || version FROM events WHERE id='event:test'"), "PROCESSING:2");

  psql("UPDATE events SET state='COMPLETED', version=3 WHERE id='event:test' AND version=2");
  assert.equal(psql("SELECT state || ':' || version FROM events WHERE id='event:test'"), "COMPLETED:3");

  psql("UPDATE evidence SET verification='VERIFIED' WHERE id='evidence:test'");
  assert.equal(psql("SELECT verification FROM evidence WHERE id='evidence:test'"), "VERIFIED");

  assert.throws(() => psql(`
    INSERT INTO events(id,action_id,type,occurred_at,state,actor_id,context_id,source,version)
      VALUES ('event:bad-state','action:event-test','bad',now(),'PROCESSING','identity:event-test','context:event-test','system',1);
  `), "physical state mismatch is application-boundary coverage; raw FK schema alone does not infer Action state");

  psql("BEGIN; INSERT INTO events(id,type,occurred_at,state,source,version) VALUES ('event:rollback','standalone',now(),'REQUESTED','test',1); INSERT INTO evidence(id,event_id,source,verification,recorded_at) VALUES ('evidence:rollback','event:rollback','test','UNVERIFIED',now()); ROLLBACK");
  assert.equal(psql("SELECT count(*) FROM events WHERE id='event:rollback'"), "0");
  assert.equal(psql("SELECT count(*) FROM evidence WHERE id='evidence:rollback'"), "0");
});
