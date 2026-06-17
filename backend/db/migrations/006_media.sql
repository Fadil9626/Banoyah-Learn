-- Banoyah Learn — Phase 7: uploaded media (video / pdf / image) for lessons.
-- Files live on disk (storage_path); this row is the metadata + the id used in
-- the public /api/media/:id URL. Structured so storage can move to S3/R2 later
-- (storage_path would become a key, served via a CDN) without schema changes.
CREATE TABLE IF NOT EXISTS media (
  id           VARCHAR(40) PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  filename     VARCHAR(255),
  mime         VARCHAR(120),
  size         BIGINT,
  storage_path TEXT NOT NULL,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_media_org ON media(org_id);
