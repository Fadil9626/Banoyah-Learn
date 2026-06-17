-- Banoyah Learn — Phase 9: assignment due-date reminder tracking.
-- Mirrors certificates.last_reminder_day: which threshold (days-before-due) was
-- last emailed for this assignment, so the scheduler doesn't repeat. Reset to
-- NULL when an assignment is (re)created with a new due date.
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS last_reminder_day INTEGER;
