-- Banoyah Learn — Phase 8: course assignments (required / mandated training).
-- Assign a course to a person with an optional due date. Status (not started /
-- in progress / completed / overdue) is derived from enrollments + certificates,
-- so nothing here blocks access — it records obligation and drives compliance.
CREATE TABLE IF NOT EXISTS assignments (
  id          SERIAL PRIMARY KEY,
  org_id      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date    DATE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (course_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_user   ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
