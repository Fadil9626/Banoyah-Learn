-- Banoyah Learn — Phase 1: tenancy + identity.

-- A customer (e.g. a Ministry of Health, a hospital network). All data is
-- scoped to an organization so one Learn instance can serve many customers.
CREATE TABLE IF NOT EXISTS organizations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(120) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Everyone is a user with a role. Learners may be provisioned via the API and
-- never log in (password_hash NULL); external_id maps them back to the user id
-- in the consumer system (HMS / eLIMS / Remedy) for the certification API.
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id   VARCHAR(160),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role          VARCHAR(20)  NOT NULL DEFAULT 'learner',  -- admin | instructor | learner
  job_title     VARCHAR(160),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_org         ON users(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_extid ON users(org_id, external_id) WHERE external_id IS NOT NULL;
