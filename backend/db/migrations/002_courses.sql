-- Banoyah Learn — Phase 2: authoring core (courses, lessons, quiz).

CREATE TABLE IF NOT EXISTS courses (
  id              SERIAL PRIMARY KEY,
  org_id          INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  category        VARCHAR(120),
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft | published
  pass_mark       INTEGER NOT NULL DEFAULT 70,           -- percent required to pass
  validity_months INTEGER,                                -- NULL = certificate never expires
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_courses_org ON courses(org_id);

CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort        INTEGER NOT NULL DEFAULT 0,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(20) NOT NULL DEFAULT 'text',  -- text | video | pdf
  body        TEXT,                                  -- text content
  media_url   TEXT,                                  -- video/pdf source (CDN later)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            SERIAL PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort          INTEGER NOT NULL DEFAULT 0,
  prompt        TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]',          -- ["Option A","Option B", ...]
  correct_index INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qq_course ON quiz_questions(course_id);
