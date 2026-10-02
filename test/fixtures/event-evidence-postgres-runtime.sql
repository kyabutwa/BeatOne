-- Ephemeral PostgreSQL runtime fixture for Event/Evidence physical verification.
-- Test-only. Never applied to Neon production.

CREATE TABLE identities (id text PRIMARY KEY);
CREATE TABLE participants (id text PRIMARY KEY);
CREATE TABLE contexts (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES participants(id),
  purpose text NOT NULL
);
CREATE TABLE authorizations (
  id text PRIMARY KEY,
  actor_id text NOT NULL REFERENCES identities(id)
);
CREATE TABLE proposals (
  id text PRIMARY KEY,
  actor_id text NOT NULL REFERENCES identities(id)
);
CREATE TABLE actions (
  id text PRIMARY KEY,
  actor_id text NOT NULL REFERENCES identities(id),
  proposal_id text REFERENCES proposals(id),
  authorization_id text NOT NULL REFERENCES authorizations(id),
  state varchar(32) NOT NULL,
  operation text NOT NULL,
  context_id text REFERENCES contexts(id),
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT actions_state_check CHECK (state IN (
    'REQUESTED','AUTHORIZED','PROCESSING','COMPLETED','DENIED','REJECTED',
    'FAILED','EXPIRED','CANCELLED','PARTIAL','DISPUTED','REVERSED','RECONCILED'
  )),
  CONSTRAINT actions_version_check CHECK (version >= 1)
);

CREATE TABLE action_executions (
  id text PRIMARY KEY,
  action_id text NOT NULL REFERENCES actions(id),
  proposal_id text NOT NULL REFERENCES proposals(id),
  authorization_id text NOT NULL REFERENCES authorizations(id),
  status text NOT NULL,
  provider_reference text,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  result jsonb,
  idempotency_key text NOT NULL UNIQUE,
  CONSTRAINT action_executions_status_check CHECK (status IN ('started','succeeded','failed','cancelled')),
  CONSTRAINT action_executions_finished_state_check CHECK ((status = 'started' AND finished_at IS NULL) OR (status <> 'started' AND finished_at IS NOT NULL))
);

CREATE TABLE events (
  id text PRIMARY KEY,
  action_id text REFERENCES actions(id) ON DELETE RESTRICT,
  type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  state varchar(32) NOT NULL,
  actor_id text REFERENCES identities(id) ON DELETE RESTRICT,
  context_id text REFERENCES contexts(id) ON DELETE RESTRICT,
  source text NOT NULL,
  correlation_id text,
  causation_id text,
  version bigint NOT NULL DEFAULT 1,
  CONSTRAINT events_state_check CHECK (state IN (
    'REQUESTED','AUTHORIZED','PROCESSING','COMPLETED','DENIED','REJECTED',
    'FAILED','EXPIRED','CANCELLED','PARTIAL','DISPUTED','REVERSED','RECONCILED'
  )),
  CONSTRAINT events_type_not_blank CHECK (btrim(type) <> ''),
  CONSTRAINT events_source_not_blank CHECK (btrim(source) <> ''),
  CONSTRAINT events_correlation_not_blank CHECK (correlation_id IS NULL OR btrim(correlation_id) <> ''),
  CONSTRAINT events_causation_not_blank CHECK (causation_id IS NULL OR btrim(causation_id) <> ''),
  CONSTRAINT events_version_check CHECK (version >= 1)
);

CREATE TABLE evidence (
  id text PRIMARY KEY,
  event_id text REFERENCES events(id) ON DELETE RESTRICT,
  source text NOT NULL,
  verification varchar(16) NOT NULL,
  recorded_at timestamptz NOT NULL,
  external_provider text,
  external_reference text,
  CONSTRAINT evidence_source_not_blank CHECK (btrim(source) <> ''),
  CONSTRAINT evidence_verification_check CHECK (verification IN ('UNVERIFIED','VERIFIED','REJECTED')),
  CONSTRAINT evidence_provider_reference_atomic CHECK (
    (external_provider IS NULL AND external_reference IS NULL)
    OR (external_provider IS NOT NULL AND external_reference IS NOT NULL)
  )
);

CREATE TABLE action_outcome_trace (
  execution_id text PRIMARY KEY REFERENCES action_executions(id),
  event_id text NOT NULL REFERENCES events(id),
  evidence_id text NOT NULL REFERENCES evidence(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, evidence_id)
);

CREATE INDEX events_action_id_idx ON events(action_id) WHERE action_id IS NOT NULL;
CREATE INDEX events_actor_id_idx ON events(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX events_context_id_idx ON events(context_id) WHERE context_id IS NOT NULL;
CREATE INDEX events_correlation_id_idx ON events(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX events_occurred_at_idx ON events(occurred_at);
CREATE INDEX evidence_event_id_idx ON evidence(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX evidence_verification_idx ON evidence(verification);
CREATE INDEX action_outcome_trace_event_idx ON action_outcome_trace(event_id);
