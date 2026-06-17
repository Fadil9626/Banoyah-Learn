-- Banoyah Learn — Phase 12: quiz options per course.
-- shuffle_questions: randomize question order for each attempt.
-- max_attempts: cap attempts until passed (0 = unlimited).
ALTER TABLE courses ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 0;
