// Seed realistic demo data so the dashboard + learner screens look alive.
// Idempotent: demo learners (external_id='demo') and demo activity (details->>'seed'='demo')
// are wiped and recreated each run; real users/courses are never touched.
//   node scripts/seed-demo.js
const pool = require("../config/db");
let bcrypt; try { bcrypt = require("bcryptjs"); } catch { bcrypt = null; }

const NAMES = [
  "Aminata Kamara", "Mohamed Sesay", "Fatmata Bangura", "Ibrahim Koroma", "Isatu Conteh",
  "Abu Bakarr Turay", "Mariama Jalloh", "Santigie Kargbo", "Hawa Mansaray", "Alhaji Bah",
  "Kadiatu Fofanah", "Sorie Kanu", "Zainab Dumbuya", "Foday Sankoh", "Adama Turay",
  "Osman Barrie", "Memuna Koroma", "Sahr Ngombu",
];
const TITLES = ["Nurse", "Lab Technician", "Pharmacist", "Receptionist", "Ward Assistant", "Records Clerk", "Cleaner", "Security Officer", "Driver", "Storekeeper"];
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const serial = () => "BL-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + rand(1000, 9999);

const DEMO_COURSES = [
  { title: "Infection Prevention & Control", category: "Clinical", pass_mark: 80, validity_months: 12 },
  { title: "Fire Safety & Evacuation", category: "Health & Safety", pass_mark: 70, validity_months: 12 },
  { title: "Patient Data Confidentiality", category: "Compliance", pass_mark: 75, validity_months: 24 },
  { title: "Hand Hygiene Essentials", category: "Clinical", pass_mark: 80, validity_months: 6 },
];

(async () => {
  const client = await pool.connect();
  try {
    const org = (await client.query("SELECT id FROM organizations ORDER BY id LIMIT 1")).rows[0];
    if (!org) throw new Error("No organization found — create the org first.");
    const orgId = org.id;
    const staff = (await client.query(
      "SELECT id, name FROM users WHERE org_id=$1 AND role IN ('admin','instructor') ORDER BY id LIMIT 1", [orgId]
    )).rows[0] || { id: null, name: "Admin" };

    await client.query("BEGIN");

    // ── Wipe previous demo data (cascades enrollments/certs/assignments) ──
    await client.query("DELETE FROM users WHERE org_id=$1 AND external_id LIKE 'demo-%'", [orgId]);
    await client.query("DELETE FROM audit_log WHERE org_id=$1 AND details->>'seed'='demo'", [orgId]);

    // ── Ensure at least 3 published courses (create demo ones tagged in description) ──
    let courses = (await client.query(
      "SELECT id, title, pass_mark, validity_months FROM courses WHERE org_id=$1 AND status='published' ORDER BY id", [orgId]
    )).rows;
    if (courses.length < 3) {
      for (const dc of DEMO_COURSES) {
        const exists = (await client.query("SELECT id FROM courses WHERE org_id=$1 AND title=$2", [orgId, dc.title])).rows[0];
        let cid = exists?.id;
        if (!cid) {
          cid = (await client.query(
            `INSERT INTO courses (org_id,title,description,category,status,pass_mark,validity_months,created_by,created_at)
             VALUES ($1,$2,$3,$4,'published',$5,$6,$7,$8) RETURNING id`,
            [orgId, dc.title, "[demo] " + dc.title + " — sample course.", dc.category, dc.pass_mark, dc.validity_months, staff.id, daysAgo(rand(120, 300))]
          )).rows[0].id;
          for (let i = 0; i < 3; i++)
            await client.query(`INSERT INTO lessons (course_id,sort,title,type,body) VALUES ($1,$2,$3,'text',$4)`,
              [cid, i, `Lesson ${i + 1}`, "Sample lesson content for the demo course."]);
          for (let i = 0; i < 4; i++)
            await client.query(`INSERT INTO quiz_questions (course_id,sort,prompt,options,correct_index) VALUES ($1,$2,$3,$4,$5)`,
              [cid, i, `Sample question ${i + 1}?`, JSON.stringify(["Option A", "Option B", "Option C", "Option D"]), rand(0, 3)]);
        }
      }
      courses = (await client.query(
        "SELECT id, title, pass_mark, validity_months FROM courses WHERE org_id=$1 AND status='published' ORDER BY id", [orgId]
      )).rows;
    }

    const hash = bcrypt ? bcrypt.hashSync("demo1234", 10) : null;
    let nLearners = 0, nPassed = 0, nProgress = 0, nCerts = 0, nAssign = 0, nOverdue = 0;

    for (const [i, name] of NAMES.entries()) {
      const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@demo.banoyah.local";
      const created = daysAgo(rand(30, 330));
      const uid = (await client.query(
        `INSERT INTO users (org_id,external_id,name,email,password_hash,role,job_title,created_at)
         VALUES ($1,$2,$3,$4,$5,'learner',$6,$7) RETURNING id`,
        [orgId, `demo-${i}`, name, email, hash, pick(TITLES), created]
      )).rows[0].id;
      nLearners++;

      // Enrol in 2–3 courses with a realistic outcome mix.
      const mine = [...courses].sort(() => Math.random() - 0.5).slice(0, rand(2, 3));
      for (const c of mine) {
        const roll = Math.random();
        const enrolledAt = daysAgo(rand(5, 175));
        if (roll < 0.6) {
          // Passed → enrollment + certificate (issue date spread over ~6 months for the trend)
          const score = rand(Math.max(70, c.pass_mark), 100);
          const issued = daysAgo(rand(3, 175));
          const until = c.validity_months ? new Date(issued.getTime() + c.validity_months * 30 * 86400000) : null;
          await client.query(
            `INSERT INTO enrollments (org_id,user_id,course_id,status,progress_pct,best_score,enrolled_at,updated_at)
             VALUES ($1,$2,$3,'passed',100,$4,$5,$6) ON CONFLICT DO NOTHING`,
            [orgId, uid, c.id, score, enrolledAt, issued]);
          await client.query(
            `INSERT INTO certificates (org_id,user_id,course_id,serial,score,issued_at,certified_until)
             VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
            [orgId, uid, c.id, serial(), score, issued, until]);
          nPassed++; nCerts++;
        } else if (roll < 0.85) {
          await client.query(
            `INSERT INTO enrollments (org_id,user_id,course_id,status,progress_pct,enrolled_at,updated_at)
             VALUES ($1,$2,$3,'in_progress',$4,$5,NOW()) ON CONFLICT DO NOTHING`,
            [orgId, uid, c.id, rand(10, 80), enrolledAt]);
          nProgress++;
        }
        // Assign ~half of the courses with a due date; make ~a third overdue.
        if (Math.random() < 0.5) {
          const overdue = Math.random() < 0.35;
          const due = overdue ? daysAgo(rand(3, 40)) : new Date(Date.now() + rand(5, 45) * 86400000);
          const r = await client.query(
            `INSERT INTO assignments (org_id,course_id,user_id,due_date,assigned_by,created_at)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING id`,
            [orgId, c.id, uid, due, staff.id, daysAgo(rand(40, 120))]);
          if (r.rowCount) { nAssign++; if (overdue) nOverdue++; }
        }
      }
    }

    // ── Recent activity texture (meaningful events, spread over the last few weeks) ──
    const acts = [
      ["course.publish", () => pick(courses).title], ["assignment.create", () => pick(courses).title],
      ["certificate.issue", () => pick(courses).title], ["user.create", () => pick(NAMES)],
      ["user.import", () => `${rand(3, 12)} people`], ["settings.branding", () => null],
    ];
    for (let i = 0; i < 14; i++) {
      const [action, tgt] = pick(acts);
      await client.query(
        `INSERT INTO audit_log (org_id,actor_id,actor_name,action,target,details,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [orgId, staff.id, staff.name, action, tgt(), JSON.stringify({ seed: "demo" }), daysAgo(rand(0, 25))]);
    }

    await client.query("COMMIT");
    console.log(`✓ Demo seed complete for org ${orgId}:`);
    console.log(`  learners: ${nLearners} | passed: ${nPassed} | in-progress: ${nProgress} | certificates: ${nCerts}`);
    console.log(`  assignments: ${nAssign} (${nOverdue} overdue) | courses used: ${courses.length}`);
    console.log(`  Re-run to refresh; wipe with: DELETE FROM users WHERE external_id='demo';`);
    process.exit(0);
  } catch (e) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("Seed failed:", e.message);
    process.exit(1);
  }
})();
