-- Banoyah Learn — Phase 6: per-org settings (SMTP + reminder config) and
-- certificate reminder tracking.

CREATE TABLE IF NOT EXISTS org_settings (
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key    VARCHAR(100) NOT NULL,
  value  TEXT,
  PRIMARY KEY (org_id, key)
);

-- Which reminder threshold (days-before-expiry) was last emailed for this cert,
-- so the scheduler doesn't re-send the same reminder. Reset to NULL when a
-- certificate is re-issued (the learner re-certifies).
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS last_reminder_day INTEGER;
