-- Ephemeral PostgreSQL runtime fixture for Payments physical verification.
-- This is test-only and is never applied to Neon production.
CREATE TABLE identities (id text PRIMARY KEY);
CREATE TABLE participants (id text PRIMARY KEY);
CREATE TABLE communities (id text PRIMARY KEY);
CREATE TABLE contexts (id text PRIMARY KEY, participant_id text NOT NULL REFERENCES participants(id), purpose text NOT NULL, active_at timestamptz NOT NULL, state jsonb NOT NULL);
CREATE TABLE services (id text PRIMARY KEY, name text NOT NULL, domain text NOT NULL, status text NOT NULL);
CREATE TABLE capabilities (id text PRIMARY KEY, service_id text NOT NULL REFERENCES services(id), name text NOT NULL, action text NOT NULL, allowed_roles jsonb NOT NULL, requires_explicit_authorization boolean NOT NULL, resource_type text NOT NULL, scope jsonb NOT NULL);
CREATE TABLE proposals (id text PRIMARY KEY, context_id text NOT NULL REFERENCES contexts(id), required_capability_id text NOT NULL REFERENCES capabilities(id), summary text NOT NULL);
ALTER TABLE contexts ADD CONSTRAINT contexts_id_participant_uq UNIQUE (id, participant_id);
ALTER TABLE capabilities ADD CONSTRAINT capabilities_id_action_uq UNIQUE (id, action);
ALTER TABLE proposals ADD CONSTRAINT proposals_binding_uq UNIQUE (id, context_id, required_capability_id);
CREATE TABLE authorizations (
  id text PRIMARY KEY,
  participant_id text NOT NULL REFERENCES participants(id),
  context_id text NOT NULL REFERENCES contexts(id),
  capability_id text NOT NULL REFERENCES capabilities(id),
  action text NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL,
  status text NOT NULL,
  issued_by_participant_id text REFERENCES participants(id),
  proposal_id text REFERENCES proposals(id),
  FOREIGN KEY (context_id, participant_id) REFERENCES contexts(id, participant_id)
);
ALTER TABLE authorizations ADD CONSTRAINT authorizations_capability_action_fkey FOREIGN KEY (capability_id, action) REFERENCES capabilities(id, action);
ALTER TABLE authorizations ADD CONSTRAINT authorizations_proposal_binding_fkey FOREIGN KEY (proposal_id, context_id, capability_id) REFERENCES proposals(id, context_id, required_capability_id);
CREATE TABLE actions (
  id text PRIMARY KEY,
  participant_id text,
  context_id text,
  capability_id text,
  action text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE action_executions (id text PRIMARY KEY, action_id text NOT NULL REFERENCES actions(id));
CREATE TABLE events (
  id text PRIMARY KEY,
  action_id text,
  type text NOT NULL,
  state text NOT NULL,
  actor_id text,
  context_id text,
  source text NOT NULL,
  occurred_at timestamptz NOT NULL,
  FOREIGN KEY (action_id) REFERENCES actions(id)
);
CREATE TABLE evidence (
  id text PRIMARY KEY,
  event_id text,
  source text NOT NULL,
  verification text NOT NULL,
  recorded_at timestamptz NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id)
);
CREATE TABLE payment_intents (id text PRIMARY KEY);
CREATE TABLE payment_events (id text PRIMARY KEY, payment_intent_id text REFERENCES payment_intents(id));
CREATE TABLE zalagren_schema_migrations (id text PRIMARY KEY);
