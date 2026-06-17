-- Banoyah Learn — Phase 14: one-time SSO login links (for consumer systems like
-- ELIMS to hand a staff member straight into their courses).
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_token_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_expires_at TIMESTAMPTZ;
