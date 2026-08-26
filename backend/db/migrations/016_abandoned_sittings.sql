-- ─────────────────────────────────────────────────────────────────────────────
-- Abandoning a timed exam used to cost nothing: no attempt was recorded until a
-- paper was submitted, so a candidate could start, read the questions, close the
-- tab, and start again on a fresh paper — indefinitely, and without spending any
-- of their max_attempts. That made both the attempt limit and the question bank
-- worthless on any course that mattered.
--
-- A sitting that runs out unsubmitted is now settled as a failed attempt, so
-- starting the exam is a commitment. Per-course, because a practice course may
-- reasonably want the old lenience.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS abandon_counts BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN courses.abandon_counts IS
  'When a timed sitting expires unsubmitted, record it as a failed attempt.';

-- The sweeper looks for open sittings only; a partial index keeps that cheap as
-- the submitted rows accumulate.
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_open
  ON quiz_sessions (expires_at)
  WHERE submitted_at IS NULL;
