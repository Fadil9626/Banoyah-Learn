-- Banoyah Learn — Phase 14: course prerequisites (leveled learning tracks).
-- Chain courses into a progression: a course stays locked until the learner has
-- PASSED its prerequisite. ON DELETE SET NULL so removing a level unlocks its
-- follower rather than orphaning it.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite_course_id
  INTEGER REFERENCES courses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_courses_prereq ON courses(prerequisite_course_id);
