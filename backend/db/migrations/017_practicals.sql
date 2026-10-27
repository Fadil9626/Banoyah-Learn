-- ─────────────────────────────────────────────────────────────────────────────
-- 3D practical exams.
--
-- A course can now end in a practical as well as a quiz: the learner studies,
-- passes the quiz, and that unlocks a 3D scenario (a patient in a phlebotomy
-- chair, say) where they have to do the job. The certificate comes from the
-- practical, not the quiz.
--
-- The scenarios themselves live in code (backend/lib/practical/scenarios), and
-- a course points at one by key. Every run is kept, whole: what the learner said
-- and picked up, second by second, is the record a supervisor reviews.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_key VARCHAR(40);
COMMENT ON COLUMN courses.practical_key IS
  'The 3D practical that ends this course, e.g. phleb-101. NULL: the quiz alone certifies.';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_pass_mark INTEGER NOT NULL DEFAULT 85;
COMMENT ON COLUMN courses.practical_pass_mark IS
  'Score out of 100 needed in the practical. A critical safety error fails it whatever the score.';

CREATE TABLE IF NOT EXISTS practical_sessions (
  id              SERIAL PRIMARY KEY,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id   INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  scenario_key    VARCHAR(40) NOT NULL,

  -- practice: feedback as you go, counts for nothing. exam: feedback at the
  -- end, and a pass issues the certificate.
  mode            VARCHAR(10) NOT NULL CHECK (mode IN ('practice', 'exam')),

  -- The whole run as the engine keeps it: patient, step, flags, score, and the
  -- timestamped log of every action.
  state           JSONB NOT NULL,

  score           INTEGER,
  passed          BOOLEAN,
  critical        BOOLEAN,
  -- Set when an exam was walked away from and closed by the server.
  abandoned       BOOLEAN NOT NULL DEFAULT FALSE,

  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_action_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,

  -- The supervisor's note on an attempt ("talked it through, re-take Friday").
  review_note     TEXT,
  reviewed_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_practical_course ON practical_sessions (course_id, finished_at DESC);
CREATE INDEX IF NOT EXISTS idx_practical_user   ON practical_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_practical_open
  ON practical_sessions (enrollment_id, mode) WHERE finished_at IS NULL;
