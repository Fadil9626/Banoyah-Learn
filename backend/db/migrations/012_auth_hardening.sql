-- Banoyah Learn — Phase 13: auth hardening.
--  • token_version   — bump to revoke all of a user's existing sessions
--  • totp_*          — TOTP 2FA (secret, enabled flag, replay guard)
--  • reset_token_*   — self-service password reset link
--  • team            — unit/facility/district for team-scoped manager role
--  • audit hash chain — prev_hash/hash make the audit log tamper-evident
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version    INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret      TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled     BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_last_step   BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team             VARCHAR(160);

ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS prev_hash VARCHAR(64);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS hash      VARCHAR(64);
