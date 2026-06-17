-- Banoyah Learn — Phase 3: the learner experience (enrol, learn, assess, certify).

CREATE TABLE IF NOT EXISTS enrollments (
  id                SERIAL PRIMARY KEY,
  org_id            INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status            VARCHAR(20) NOT NULL DEFAULT 'in_progress',  -- in_progress | passed | failed
  progress_pct      INTEGER NOT NULL DEFAULT 0,
  best_score        INTEGER,
  completed_lessons JSONB NOT NULL DEFAULT '[]',                 -- viewed lesson ids
  enrolled_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enroll_user   ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enroll_course ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS attempts (
  id            SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL,
  passed        BOOLEAN NOT NULL,
  answers       JSONB,
  taken_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempts_enroll ON attempts(enrollment_id);

CREATE TABLE IF NOT EXISTS certificates (
  id              SERIAL PRIMARY KEY,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  serial          VARCHAR(40) UNIQUE NOT NULL,
  score           INTEGER NOT NULL,
  issued_at       TIMESTAMPTZ DEFAULT NOW(),
  certified_until TIMESTAMPTZ,                 -- NULL = never expires
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_certs_user ON certificates(user_id);
