import { execFileSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { test } from "node:test";

const url = process.env.DATABASE_URL;
if (!url) {
  test("PostgreSQL Payments runtime verification requires DATABASE_URL", { skip: true }, () => {});
}

const psql = (sql: string) =>
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-X", "-A", "-t", "-c", sql], {
    encoding: "utf8"
  }).trim();

test("PostgreSQL Payment runtime: chain, idempotency, CAS, status, atomic reference, rollback", () => {
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-X", "-f", "test/fixtures/payments-postgres-runtime.sql"], { encoding: "utf8" });
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-X", "-f", "migrations/action-physical-canonicalization-2026-10-02.sql"], { encoding: "utf8" });
  execFileSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-X", "-f", "migrations/payments-physical-canonicalization-2026-10-02.sql"], { encoding: "utf8" });
  const setup = `
    INSERT INTO identities(id) VALUES ('identity:test');
    INSERT INTO participants(id) VALUES ('participant:test');
    INSERT INTO services(id,name,domain,status) VALUES ('service:test','Payments Test','payments','active');
    INSERT INTO capabilities(id,service_id,name,action,allowed_roles,requires_explicit_authorization,resource_type,scope)
      VALUES ('capability:test','service:test','Payment test','initiate_payment','[]'::jsonb,true,'payment','{}'::jsonb);
    INSERT INTO contexts(id,participant_id,purpose,active_at,state)
      VALUES ('context:test','participant:test','payment runtime test',now(),'{}'::jsonb);
    INSERT INTO authorizations(id,participant_id,context_id,capability_id,action,source,created_at,status,issued_by_participant_id)
      VALUES ('authorization:test','participant:test','context:test','capability:test','initiate_payment','role-derived',now(),'active','participant:test');
    INSERT INTO actions(id,actor_id,authorization_id,state,operation,context_id,idempotency_key,created_at,updated_at,version)
      VALUES ('action:test','identity:test','authorization:test','AUTHORIZED','initiate_payment','context:test','action-idem-test',now(),now(),1);
    INSERT INTO action_executions(id,action_id) VALUES ('execution:test','action:test');
    INSERT INTO events(id,action_id,type,state,actor_id,context_id,source,occurred_at)
      VALUES ('event:test','action:test','payment.authorized','AUTHORIZED','identity:test','context:test','system',now());
    INSERT INTO evidence(id,event_id,source,verification,recorded_at)
      VALUES ('evidence:test','event:test','controlled-postgres-test','VERIFIED',now());
  `;
  psql(setup);

  psql(`
    INSERT INTO payments(id,payer_participant_id,amount,currency,purpose,status,actor_id,authorization_id,action_id,idempotency_key,created_at,updated_at,version)
    VALUES ('payment:test','participant:test',10.00,'KES','controlled PostgreSQL verification','AUTHORIZED','identity:test','authorization:test','action:test','payment-idem-test',now(),now(),1);
  `);
  assert.equal(psql("SELECT count(*) FROM payments WHERE id='payment:test'"), "1");
  assert.equal(psql("SELECT action_id FROM payments WHERE id='payment:test'"), "action:test");
  assert.equal(psql("SELECT event_id FROM evidence WHERE id='evidence:test'"), "event:test");

  assert.throws(() => psql(`
    INSERT INTO payments(id,payer_participant_id,amount,currency,purpose,status,actor_id,authorization_id,action_id,idempotency_key,created_at,updated_at,version)
    VALUES ('payment:conflict','participant:test',11.00,'KES','conflicting idempotency','AUTHORIZED','identity:test','authorization:test','action:test','payment-idem-test',now(),now(),1);
  `));

  psql("UPDATE payments SET status='PROCESSING', version=2, updated_at=clock_timestamp() WHERE id='payment:test' AND version=1");
  assert.equal(psql("SELECT version FROM payments WHERE id='payment:test'"), "2");
  assert.equal(psql("SELECT status FROM payments WHERE id='payment:test'"), "PROCESSING");
  assert.equal(psql("UPDATE payments SET status='COMPLETED', version=3, updated_at=clock_timestamp() WHERE id='payment:test' AND version=1 RETURNING id"), "");
  assert.equal(psql("SELECT status FROM payments WHERE id='payment:test'"), "PROCESSING");
  psql("UPDATE payments SET status='UNKNOWN', version=3, updated_at=clock_timestamp() WHERE id='payment:test' AND version=2");
  assert.equal(psql("SELECT status || ':' || version FROM payments WHERE id='payment:test'"), "UNKNOWN:3");

  assert.throws(() => psql(`
    INSERT INTO payments(id,amount,currency,purpose,status,actor_id,authorization_id,idempotency_key,created_at,updated_at,version,external_provider)
    VALUES ('payment:provider-only',10,'KES','bad reference','AUTHORIZED','identity:test','authorization:test','payment-provider-only',now(),now(),1,'provider');
  `));

  psql("BEGIN; INSERT INTO payments(id,amount,currency,purpose,status,actor_id,authorization_id,idempotency_key,created_at,updated_at,version) VALUES ('payment:rollback',10,'KES','rollback','AUTHORIZED','identity:test','authorization:test','payment-rollback',now(),now(),1); SELECT 1; ROLLBACK;");
  assert.equal(psql("SELECT count(*) FROM payments WHERE id='payment:rollback'"), "0");
});
