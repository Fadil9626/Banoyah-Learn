-- Banoyah Learn — Phase 10: audit log (who did what, when).
CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  org_id     INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id   INTEGER,
  actor_name VARCHAR(255),
  action     VARCHAR(60) NOT NULL,
  target     VARCHAR(255),
  details    JSONB,
  ip         VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
