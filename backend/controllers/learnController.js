const crypto = require("crypto");
const pool = require("../config/db");
const { certificatePDF } = require("../lib/pdf");
const audit = require("../lib/audit");
const webhooks = require("../lib/webhooks");

// Short, human-ish unique certificate serial, e.g. BL-7F3A9C2E.
const makeSerial = () => "BL-" + crypto.randomBytes(4).toString("hex").toUpperCase();

// Fisher–Yates shuffle (returns a new array).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── GET /api/learn/catalog ───────────────────────────────────────────────────
// Published courses in the org, with the caller's enrollment status (if any).
const catalog = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.title, c.description, c.category, c.pass_mark, c.validity_months,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id)       AS lesson_count,
              (SELECT COUNT(*) FROM quiz_questions q WHERE q.course_id=c.id) AS question_count,
              e.status AS enrollment_status, e.progress_pct, e.best_score
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id=c.id AND e.user_id=$1
       WHERE c.org_id=$2 AND c.status='published'
       ORDER BY c.title`,
      [req.user.id, req.user.org_id]
    );
    return res.json(rows);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/learn/courses/:id/enroll ───────────────────────────────────────
const enroll = async (req, res) => {
  try {
    const course = await publishedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not available" });
    const { rows } = await pool.query(
      `INSERT INTO enrollments (org_id, user_id, course_id) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, course_id) DO UPDATE SET updated_at=NOW()
       RETURNING *`,
      [req.user.org_id, req.user.id, course.id]
    );
    return res.status(201).json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/learn/courses/:id ───────────────────────────────────────────────
// Course content for taking it. Quiz questions are returned WITHOUT the correct
// answer so it can't be read off the wire.
const getForLearner = async (req, res) => {
  try {
    const course = await publishedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not available" });
    const lessons = (await pool.query(
      "SELECT id, sort, title, type, body, media_url FROM lessons WHERE course_id=$1 ORDER BY sort, id", [course.id]
    )).rows;
    let questions = (await pool.query(
      "SELECT id, sort, prompt, options FROM quiz_questions WHERE course_id=$1 ORDER BY sort, id", [course.id]
    )).rows;
    if (course.shuffle_questions) questions = shuffle(questions);
    const enrollment = (await pool.query(
      "SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2", [req.user.id, course.id]
    )).rows[0] || null;
    const certificate = (await pool.query(
      "SELECT * FROM certificates WHERE user_id=$1 AND course_id=$2", [req.user.id, course.id]
    )).rows[0] || null;
    const attempts_used = enrollment
      ? Number((await pool.query("SELECT COUNT(*) FROM attempts WHERE enrollment_id=$1", [enrollment.id])).rows[0].count)
      : 0;
    const passed = enrollment?.status === "passed";
    const attempts_left = course.max_attempts > 0 ? Math.max(0, course.max_attempts - attempts_used) : null;
    return res.json({ course, lessons, questions, enrollment, certificate, attempts_used, attempts_left, can_attempt: passed || attempts_left === null || attempts_left > 0 });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/learn/courses/:id/progress ─────────────────────────────────────
// Mark a lesson as viewed; recompute progress.
const markProgress = async (req, res) => {
  const lessonId = Number(req.body.lesson_id);
  if (!lessonId) return res.status(400).json({ message: "lesson_id required" });
  try {
    const course = await publishedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not available" });
    const enr = await ensureEnrollment(req.user, course.id);

    const total = (await pool.query("SELECT COUNT(*) FROM lessons WHERE course_id=$1", [course.id])).rows[0].count;
    const done = new Set((enr.completed_lessons || []).map(Number));
    done.add(lessonId);
    const pct = Number(total) ? Math.round((done.size / Number(total)) * 100) : 100;

    const { rows } = await pool.query(
      "UPDATE enrollments SET completed_lessons=$1, progress_pct=$2, updated_at=NOW() WHERE id=$3 RETURNING *",
      [JSON.stringify([...done]), Math.min(pct, 100), enr.id]
    );
    return res.json(rows[0]);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/learn/courses/:id/submit ───────────────────────────────────────
// Grade a quiz attempt. Body: { answers: { "<questionId>": <selectedIndex> } }.
// On pass, issue/refresh a certificate. Returns the score + per-question result.
const submitQuiz = async (req, res) => {
  const answers = req.body.answers || {};
  try {
    const course = await publishedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not available" });
    const enr = await ensureEnrollment(req.user, course.id);

    // Enforce the attempt limit (until passed; 0 = unlimited).
    if (course.max_attempts > 0 && enr.status !== "passed") {
      const used = Number((await pool.query("SELECT COUNT(*) FROM attempts WHERE enrollment_id=$1", [enr.id])).rows[0].count);
      if (used >= course.max_attempts) return res.status(403).json({ message: "No attempts remaining for this course" });
    }

    const questions = (await pool.query(
      "SELECT id, correct_index FROM quiz_questions WHERE course_id=$1", [course.id]
    )).rows;
    if (!questions.length) return res.status(400).json({ message: "This course has no quiz" });

    let correct = 0;
    const review = {};
    for (const q of questions) {
      const chosen = answers[q.id] ?? answers[String(q.id)];
      const isRight = Number(chosen) === q.correct_index;
      if (isRight) correct++;
      review[q.id] = { chosen: chosen ?? null, correct_index: q.correct_index, correct: isRight };
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= course.pass_mark;

    await pool.query(
      "INSERT INTO attempts (enrollment_id, score, passed, answers) VALUES ($1,$2,$3,$4)",
      [enr.id, score, passed, JSON.stringify(answers)]
    );
    const best = Math.max(score, enr.best_score ?? 0);
    await pool.query(
      "UPDATE enrollments SET status=$1, best_score=$2, updated_at=NOW() WHERE id=$3",
      [passed ? "passed" : "failed", best, enr.id]
    );

    let certificate = null;
    if (passed) {
      const until = course.validity_months
        ? new Date(Date.now() + course.validity_months * 30 * 86400000).toISOString()
        : null;
      certificate = (await pool.query(
        `INSERT INTO certificates (org_id, user_id, course_id, serial, score, certified_until)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (user_id, course_id)
         DO UPDATE SET score=EXCLUDED.score, certified_until=EXCLUDED.certified_until,
                       issued_at=NOW(), last_reminder_day=NULL
         RETURNING *`,
        [req.user.org_id, req.user.id, course.id, makeSerial(), score, until]
      )).rows[0];
      audit.record(req, "certificate.issue", { target: course.title, details: { score, serial: certificate.serial } });
      const ext = (await pool.query("SELECT external_id FROM users WHERE id=$1", [req.user.id])).rows[0]?.external_id || null;
      webhooks.emit(req.user.org_id, "certification.completed", {
        external_id: ext, learner: req.user.name, user_id: req.user.id,
        course: course.title, course_id: course.id, serial: certificate.serial,
        score, certified_until: certificate.certified_until,
      });
    }

    const used = Number((await pool.query("SELECT COUNT(*) FROM attempts WHERE enrollment_id=$1", [enr.id])).rows[0].count);
    const attempts_left = course.max_attempts > 0 ? Math.max(0, course.max_attempts - used) : null;
    return res.json({ score, passed, pass_mark: course.pass_mark, correct, total: questions.length, review, certificate, attempts_left });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/learn/me ────────────────────────────────────────────────────────
// The caller's enrollments + earned certificates (for "My Learning").
const myLearning = async (req, res) => {
  try {
    const enrollments = (await pool.query(
      `SELECT e.*, c.title, c.category, c.pass_mark
       FROM enrollments e JOIN courses c ON c.id=e.course_id
       WHERE e.user_id=$1 ORDER BY e.updated_at DESC`, [req.user.id]
    )).rows;
    const certificates = (await pool.query(
      `SELECT cert.*, c.title AS course_title, c.category
       FROM certificates cert JOIN courses c ON c.id=cert.course_id
       WHERE cert.user_id=$1 ORDER BY cert.issued_at DESC`, [req.user.id]
    )).rows;
    return res.json({ enrollments, certificates });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/learn/certificates/:serial ──────────────────────────────────────
// A single certificate (for the printable view). Scoped to the caller.
const getCertificate = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cert.*, c.title AS course_title, c.category, u.name AS learner_name, o.name AS org_name
       FROM certificates cert
       JOIN courses c ON c.id=cert.course_id
       JOIN users u ON u.id=cert.user_id
       JOIN organizations o ON o.id=cert.org_id
       WHERE cert.serial=$1 AND cert.user_id=$2`,
      [req.params.serial, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Certificate not found" });
    const brand = await loadBrand(req.user.org_id);
    return res.json({ ...rows[0], brand_accent: brand.accent, brand_logo: brand.logo });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/learn/certificates/:serial/pdf ──────────────────────────────────
// Stream the caller's certificate as a downloadable PDF.
const downloadCertificate = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cert.*, c.title AS course_title, u.name AS learner_name, o.name AS org_name
       FROM certificates cert
       JOIN courses c ON c.id=cert.course_id
       JOIN users u ON u.id=cert.user_id
       JOIN organizations o ON o.id=cert.org_id
       WHERE cert.serial=$1 AND cert.user_id=$2`,
      [req.params.serial, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Certificate not found" });
    const brand = await loadBrand(req.user.org_id);
    const safe = String(rows[0].course_title).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const verifyUrl = `${req.protocol}://${req.get("host")}/verify/${rows[0].serial}`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${safe}-${rows[0].serial}.pdf"`);
    certificatePDF({ ...rows[0], brand_accent: brand.accent, brand_logo: brand.logo, verify_url: verifyUrl }, res);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// Load this org's certificate branding (accent + optional logo data URI).
async function loadBrand(orgId) {
  const { rows } = await pool.query(
    "SELECT key, value FROM org_settings WHERE org_id=$1 AND key IN ('brand_accent','brand_logo')", [orgId]
  );
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { accent: m.brand_accent || "#4F46E5", logo: m.brand_logo || "" };
}

// ── helpers ──────────────────────────────────────────────────────────────────
async function publishedCourse(orgId, courseId) {
  const { rows } = await pool.query(
    "SELECT * FROM courses WHERE id=$1 AND org_id=$2 AND status='published'", [courseId, orgId]
  );
  return rows[0] || null;
}
async function ensureEnrollment(user, courseId) {
  const { rows } = await pool.query(
    `INSERT INTO enrollments (org_id, user_id, course_id) VALUES ($1,$2,$3)
     ON CONFLICT (user_id, course_id) DO UPDATE SET updated_at=NOW() RETURNING *`,
    [user.org_id, user.id, courseId]
  );
  return rows[0];
}

module.exports = { catalog, enroll, getForLearner, markProgress, submitQuiz, myLearning, getCertificate, downloadCertificate };
