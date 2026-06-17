-- Banoyah Learn — Phase 4: API consumers (keyed read access for other systems).
-- A consumer is another system (HMS / eLIMS / Remedy / a dashboard) granted a
-- scoped API key to read certification status. Keys are stored hashed; only a
-- short prefix is kept for display. The plaintext key is shown once on creation.
CREATE TABLE IF NOT EXISTS api_consumers (
  id           SERIAL PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         VARCHAR(160) NOT NULL,
  key_prefix   VARCHAR(20) NOT NULL,
  key_hash     VARCHAR(64) NOT NULL,        -- sha256 hex of the full key
  scopes       JSONB NOT NULL DEFAULT '["certifications:read"]',
  is_active    BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_key_hash ON api_consumers(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_consumers_org ON api_consumers(org_id);
