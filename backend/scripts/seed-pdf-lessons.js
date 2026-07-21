// Seed PDF-based courses/lessons from a folder of PDF files.
//
// Mirrors a real admin upload: copies each PDF into the media store, inserts a
// media row, then creates a published course with a PDF lesson per file. Uses
// the app's own pool + media lib so paths/schema always match.
//
//   PDF_DIR=/path/to/pdfs node -r dotenv/config scripts/seed-pdf-lessons.js
//
// Idempotent: a course with the same title is wiped and recreated.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const pool = require("../config/db");
const media = require("../lib/media");

const PDF_DIR = process.env.PDF_DIR || path.join(__dirname, "../_pdfs");

// file paths are relative to PDF_DIR
const COURSES = [
  {
    title: "Physical Activity & Exercise",
    category: "Wellness",
    description: "Evidence-based guides to staying active — for a healthy heart and for older adults. Source: US National Institutes of Health (public domain).",
    pass_mark: 70,
    lessons: [
      { file: "Exercise-Rehab/NHLBI_Physical-Activity-and-Your-Heart.pdf", title: "Physical Activity and Your Heart (NHLBI)" },
      { file: "Exercise-Rehab/NIA_Exercise-and-Older-Adults.pdf", title: "Exercise & Physical Activity for Older Adults (NIA)" },
      { file: "Exercise-Rehab/NIA_Exercise-Physical-Activity-Brochure.pdf", title: "Exercise & Physical Activity — Quick Brochure (NIA)" },
    ],
  },
  {
    title: "Nutrition & Chronic Disease",
    category: "Clinical",
    description: "Patient-education guides for healthy eating and living well with diabetes. Source: US National Institutes of Health (public domain).",
    pass_mark: 70,
    lessons: [
      { file: "Patient-Guides/NHLBI_DASH-Eating-Plan.pdf", title: "The DASH Eating Plan (NHLBI)" },
      { file: "Patient-Guides/NIDDK_4-Steps-to-Manage-Your-Diabetes.pdf", title: "4 Steps to Manage Your Diabetes (NIDDK)" },
    ],
  },
];

async function main() {
  media.ensureDir();
  const admin = (await pool.query("SELECT id, org_id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1")).rows[0];
  if (!admin) throw new Error("No admin user found — bootstrap the org first.");
  const { id: userId, org_id: orgId } = admin;

  let totalLessons = 0;
  for (const c of COURSES) {
    await pool.query("DELETE FROM courses WHERE org_id=$1 AND title=$2", [orgId, c.title]);
    const course = (await pool.query(
      `INSERT INTO courses (org_id, title, description, category, pass_mark, validity_months, shuffle_questions, max_attempts, status, created_by)
       VALUES ($1,$2,$3,$4,$5,NULL,false,0,'published',$6) RETURNING id`,
      [orgId, c.title, c.description, c.category, c.pass_mark, userId]
    )).rows[0];

    let sort = 0;
    for (const les of c.lessons) {
      const src = path.join(PDF_DIR, les.file);
      if (!fs.existsSync(src)) { console.warn("  ! missing:", les.file); continue; }
      const id = crypto.randomUUID();
      const storage = id + ".pdf";
      fs.copyFileSync(src, path.join(media.UPLOAD_DIR, storage));
      const size = fs.statSync(src).size;
      await pool.query(
        `INSERT INTO media (id, org_id, filename, mime, size, storage_path, created_by)
         VALUES ($1,$2,$3,'application/pdf',$4,$5,$6)`,
        [id, orgId, path.basename(les.file), size, storage, userId]
      );
      await pool.query(
        `INSERT INTO lessons (course_id, sort, title, type, body, media_url)
         VALUES ($1,$2,$3,'pdf',$4,$5)`,
        [course.id, sort++, les.title, "Open the PDF to read this lesson.", `/api/media/${id}`]
      );
      totalLessons++;
      console.log("  +", les.title);
    }
    console.log(`✓ ${c.title}`);
  }
  console.log(`\n✓ Done: ${COURSES.length} courses, ${totalLessons} PDF lessons.`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
