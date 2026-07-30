// Seed the BS-430 Operator Training track — seven courses chained by prerequisite.
//
// Mirrors a real admin upload: copies the manual PDF into the media store once,
// inserts a media row, then creates each level as a published course whose
// prerequisite is the level before it. Uses the app's own pool + media lib so
// paths and schema always match.
//
//   MANUAL_PDF=/path/to/BS-430-Users-Manual-pdf.pdf node -r dotenv/config scripts/seed-bs430.js
//
// Idempotent: courses with the same titles are wiped and recreated. Deleting in
// reverse order first clears prerequisite_course_id via ON DELETE SET NULL.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pool = require("../config/db");
const media = require("../lib/media");
const { LEVELS } = require("./bs430-content");

const MANUAL_PDF = process.env.MANUAL_PDF || path.join(__dirname, "../_pdfs/BS-430-Users-Manual-pdf.pdf");
const MANUAL_NAME = "BS-430-Operators-Manual.pdf";

async function loadManual(orgId, userId) {
  if (!fs.existsSync(MANUAL_PDF)) {
    throw new Error(`Manual not found at ${MANUAL_PDF}. Set MANUAL_PDF to its location.`);
  }
  // Reuse the existing media row across re-runs so the 12 MB file isn't duplicated.
  const existing = (await pool.query(
    "SELECT id FROM media WHERE org_id=$1 AND filename=$2 LIMIT 1", [orgId, MANUAL_NAME]
  )).rows[0];
  if (existing && fs.existsSync(path.join(media.UPLOAD_DIR, existing.id + ".pdf"))) return existing.id;

  const id = crypto.randomUUID();
  fs.copyFileSync(MANUAL_PDF, path.join(media.UPLOAD_DIR, id + ".pdf"));
  await pool.query(
    `INSERT INTO media (id, org_id, filename, mime, size, storage_path, created_by)
     VALUES ($1,$2,$3,'application/pdf',$4,$5,$6)`,
    [id, orgId, MANUAL_NAME, fs.statSync(MANUAL_PDF).size, id + ".pdf", userId]
  );
  return id;
}

async function main() {
  media.ensureDir();
  const admin = (await pool.query(
    "SELECT id, org_id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1"
  )).rows[0];
  if (!admin) throw new Error("No admin user found — bootstrap the org first.");
  const { id: userId, org_id: orgId } = admin;

  const mediaId = await loadManual(orgId, userId);
  console.log("✓ manual in media store:", mediaId);

  // Wipe by title prefix rather than exact titles: renumbering a level changes
  // its title, and matching exactly would strand the old row as an orphan
  // sitting outside the chain. ON DELETE SET NULL clears the prerequisite
  // pointers as rows go, so order doesn't matter here.
  const wiped = await pool.query(
    "DELETE FROM courses WHERE org_id=$1 AND title LIKE 'BS-430 Level %'", [orgId]
  );
  if (wiped.rowCount) console.log(`  (cleared ${wiped.rowCount} existing BS-430 course${wiped.rowCount === 1 ? "" : "s"})`);

  let prerequisiteId = null;
  for (const level of LEVELS) {
    const course = (await pool.query(
      `INSERT INTO courses (org_id, title, description, category, pass_mark, validity_months,
                            shuffle_questions, max_attempts, prerequisite_course_id, status, created_by)
       VALUES ($1,$2,$3,$4,$5,NULL,true,0,$6,'published',$7) RETURNING id`,
      [orgId, level.title, level.description, level.category, level.pass_mark, prerequisiteId, userId]
    )).rows[0];

    let sort = 0;
    for (const lesson of level.lessons) {
      await pool.query(
        `INSERT INTO lessons (course_id, sort, title, type, body, media_url)
         VALUES ($1,$2,$3,'text',$4,NULL)`,
        [course.id, sort++, lesson.title, lesson.body]
      );
    }
    await pool.query(
      `INSERT INTO lessons (course_id, sort, title, type, body, media_url)
       VALUES ($1,$2,$3,'pdf',$4,$5)`,
      [course.id, sort++, "Reference — Full BS-430 Operator's Manual",
       "The complete 397-page manual. Use it to look up any procedure in full detail.",
       `/api/media/${mediaId}`]
    );

    let qSort = 0;
    for (const q of level.questions) {
      await pool.query(
        `INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index)
         VALUES ($1,$2,$3,$4,$5)`,
        [course.id, qSort++, q.prompt, JSON.stringify(q.options), q.correct_index]
      );
    }

    prerequisiteId = course.id;
    console.log(`  + ${level.title} — ${sort} lessons, ${qSort} questions`);
  }

  console.log(`\n✓ Done: ${LEVELS.length} chained levels published.`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
