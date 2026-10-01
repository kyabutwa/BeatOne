-- Disposable legacy-shaped PostgreSQL fixture for Event/Evidence migration rehearsal.
-- Test-only. Never applied to production.

CREATE TABLE identities (id text PRIMARY KEY);
CREATE TABLE participants (id text PRIMARY KEY);
CREATE TABLE contexts (id text PRIMARY KEY);
CREATE TABLE actions (id text PRIMARY KEY);

CREATE TABLE events (
  id text PRIMARY KEY,
  title text NOT NULL,
  context_id text NOT NULL,
  participant_id text NOT NULL,
  type text NOT NULL,
  actor_id text,
  authorization_id text,
  source text,
  status text NOT NULL,
  occurred_at timestamptz NOT NULL,
  metadata jsonb
);
ALTER TABLE events
  ADD CONSTRAINT events_source_check CHECK (source IN ('participant','provider','device','system')),
  ADD CONSTRAINT events_status_check CHECK (status IN ('open','pending','resolved'));

CREATE TABLE evidence (
  id text PRIMARY KEY,
  status text NOT NULL,
  statement text NOT NULL,
  source text,
  observed_at timestamptz
);
ALTER TABLE evidence
  ADD CONSTRAINT evidence_status_check CHECK (status IN ('verified','observed','inferred','hypothesis','demo'));

CREATE TABLE event_evidence (
  event_id text NOT NULL REFERENCES events(id),
  evidence_id text NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (event_id,evidence_id)
);

CREATE TABLE action_outcome_trace (
  execution_id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES events(id),
  evidence_id text NOT NULL REFERENCES evidence(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
