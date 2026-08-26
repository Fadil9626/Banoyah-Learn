-- Banoyah Learn — exam integrity: a clock, a shuffle that means something, and
-- an answer key that is not handed out.
--
-- Three faults that only matter once somebody wants to game the thing, which is
-- the moment a certificate starts being worth having:
--
--   * No time limit. An "exam" somebody can sit with the lessons open in
--     another tab for an hour certifies patience.
--   * Shuffling was per-course and off by default, and only ever reordered the
--     questions — the options stayed put, so the shape of the answers was
--     memorable even when the order was not.
--   * The correct answers came back in the submit response whatever the score.
--     Fail, read the key, retake, pass. Retakes were decorative.

-- ── Course settings ────────────────────────────────────────────────────────
ALTER TABLE courses ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER NOT NULL DEFAULT 0;
COMMENT ON COLUMN courses.time_limit_minutes IS
  'Minutes allowed for the exam. 0 means untimed — the right default for a course that is teaching rather than testing.';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN NOT NULL DEFAULT TRUE;
COMMENT ON COLUMN courses.shuffle_options IS
  'Shuffle the answers within each question. Reordering questions alone leaves "it was the third one" working.';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS reveal_answers VARCHAR(16) NOT NULL DEFAULT 'on_pass';
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_reveal_answers_check;
ALTER TABLE courses ADD CONSTRAINT courses_reveal_answers_check
  CHECK (reveal_answers IN ('never', 'on_pass', 'always'));
COMMENT ON COLUMN courses.reveal_answers IS
  'never: only a score. on_pass: the answer key once they have passed, so it teaches without arming a retake. always: open-book practice.';

-- New courses shuffle by default. Existing ones keep whatever they were set to:
-- changing an exam somebody is part-way through is not this migration's business.
ALTER TABLE courses ALTER COLUMN shuffle_questions SET DEFAULT TRUE;

-- ── A sitting of the exam ──────────────────────────────────────────────────
--
-- The session is what makes the clock and the shuffle real. Without it the
-- order is decided fresh on every request — so refreshing mid-exam reshuffles
-- the paper under the candidate — and there is nothing to measure elapsed time
-- against but the client's word.
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id             SERIAL PRIMARY KEY,
  enrollment_id  INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  course_id      INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- The paper as handed out: question ids in order, and for each one the order
  -- its options were displayed in. Kept so a reload returns the same paper, and
  -- so grading can be checked against what was actually shown.
  question_order JSONB NOT NULL DEFAULT '[]',

  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL when the course is untimed. Set once, at the start, from the server's
  -- clock — the client is never asked what time it is.
  expires_at     TIMESTAMPTZ,
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_open
  ON quiz_sessions (enrollment_id) WHERE submitted_at IS NULL;
