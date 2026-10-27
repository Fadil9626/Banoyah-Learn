-- ─────────────────────────────────────────────────────────────────────────────
-- A final mark from theory and practical, weighted.
--
-- In a lab, doing the job counts for more than knowing about it. A course that
-- ends in a 3D practical now certifies on a combined mark:
--
--   final = quiz score × (100 − practical_weight)% + practical score × practical_weight%
--
-- and passes when the final mark reaches final_pass_mark, the practical reaches
-- its own minimum (practical_pass_mark, 0 = none), and there was no critical
-- safety error.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE courses ADD COLUMN IF NOT EXISTS practical_weight INTEGER NOT NULL DEFAULT 70;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_practical_weight_check;
ALTER TABLE courses ADD CONSTRAINT courses_practical_weight_check CHECK (practical_weight BETWEEN 0 AND 100);
COMMENT ON COLUMN courses.practical_weight IS
  'Share of the final mark that comes from the practical, in percent. The quiz carries the rest.';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS final_pass_mark INTEGER NOT NULL DEFAULT 80;
COMMENT ON COLUMN courses.final_pass_mark IS
  'The combined theory + practical mark needed for the certificate.';

COMMENT ON COLUMN courses.practical_pass_mark IS
  'Minimum practical score, whatever the final mark. 0 means no minimum. A critical safety error fails it regardless.';

-- What a finished run was graded on, so the record stays true if the course's
-- weights change later.
ALTER TABLE practical_sessions ADD COLUMN IF NOT EXISTS theory_score INTEGER;
ALTER TABLE practical_sessions ADD COLUMN IF NOT EXISTS final_score  INTEGER;
ALTER TABLE practical_sessions ADD COLUMN IF NOT EXISTS grading      JSONB;
