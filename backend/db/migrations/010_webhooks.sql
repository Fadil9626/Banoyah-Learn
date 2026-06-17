-- Banoyah Learn — Phase 11: outbound webhooks.
-- Consumer systems register an endpoint + the events they care about. Each
-- delivery is signed (HMAC-SHA256 of the body with the endpoint secret) so the
-- receiver can verify authenticity.
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id                SERIAL PRIMARY KEY,
  org_id            INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url               TEXT NOT NULL,
  secret            VARCHAR(80) NOT NULL,
  events            JSONB NOT NULL DEFAULT '[]',
  is_active         BOOLEAN DEFAULT TRUE,
  last_status       INTEGER,
  last_event        VARCHAR(60),
  last_delivered_at TIMESTAMPTZ,
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhook_endpoints(org_id);
