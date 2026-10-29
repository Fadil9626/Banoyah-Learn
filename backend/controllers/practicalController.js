const pool = require("../config/db");
const engine = require("../lib/practical/engine");
const certificates = require("../lib/certificates");
const audit = require("../lib/audit");
const practicalSettings = require("../lib/practical/orgSettings");
const { publishedCourse, prerequisiteBlock, ensureEnrollment, quizPassed } = require("./learnController");

// An exam nobody has touched for this long is treated as walked away from: it is
// closed as not passed, so leaving a bad run to start a fresh patient costs the
// attempt, as it does for a timed quiz.
const STALE_HOURS = 2;

// Close the caller's runs that went quiet. Exams count as failed; practice runs
// are simply closed.
async function closeStale(enrollmentId) {
  await pool.query(
    `UPDATE practical_sessions
        SET finished_at = NOW(), abandoned = TRUE,
            score = (state->>'score')::int,
            passed = CASE WHEN mode = 'exam' THEN FALSE END,
            critical = jsonb_array_length(state->'crits') > 0
      WHERE enrollment_id = $1 AND finished_at IS NULL
        AND last_action_at < NOW() - make_interval(hours => $2::int)`,
    [enrollmentId, STALE_HOURS]
  );
}

const out = (row, view, extra = {}) => ({
  session_id: row.id, mode: row.mode, view, ...extra,
});

// ── POST /api/learn/courses/:id/practical/start  { mode: "practice" | "exam" } ──
// Resumes an open run of the same mode, so a reload or a dropped connection
// never hands out a fresh patient.
const start = async (req, res) => {
  try {
    const course = await publishedCourse(req.user.org_id, req.params.id);
    if (!course) return res.status(404).json({ message: "Course not available" });
    if (!course.practical_key || !engine.get(course.practical_key)) return res.status(400).json({ message: "This course has no practical" });
    const blocked = await prerequisiteBlock(req.user.id, course);
    if (blocked) return res.status(403).json({ message: blocked });
    const enr = await ensureEnrollment(req.user, course.id);

    const questions = Number((await pool.query("SELECT COUNT(*) FROM quiz_questions WHERE course_id=$1", [course.id])).rows[0].count);
    if (questions > 0 && !(await quizPassed(enr.id)))
      return res.status(403).json({ message: "Pass the quiz first. It unlocks the practical." });

    const mode = req.body?.mode === "practice" ? "practice" : "exam";
    await closeStale(enr.id);

    let row = (await pool.query(
      `SELECT * FROM practical_sessions WHERE enrollment_id=$1 AND mode=$2 AND finished_at IS NULL ORDER BY id DESC LIMIT 1`,
      [enr.id, mode]
    )).rows[0];
    const now = Date.now();
    if (!row) {
      // The lab's own figures, as they stand now, go into the run.
      const cfg = (await practicalSettings.read(req.user.org_id, course.practical_key))?.values;
      const state = engine.start(course.practical_key, { now, cfg });
      row = (await pool.query(
        `INSERT INTO practical_sessions (org_id, user_id, enrollment_id, course_id, scenario_key, mode, state)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.user.org_id, req.user.id, enr.id, course.id, course.practical_key, mode, JSON.stringify(state)]
      )).rows[0];
      if (mode === "exam") audit.record(req, "practical.start", { target: course.title, details: { session: row.id, patient: state.patient } });
    }
    return res.json(out(row, engine.view(row.state, now), { rules: await rulesFor(course, enr.id), course: { id: course.id, title: course.title } }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/learn/practical/:sid ────────────────────────────────────────────
const get = async (req, res) => {
  try {
    const row = (await pool.query("SELECT * FROM practical_sessions WHERE id=$1 AND user_id=$2", [req.params.sid, req.user.id])).rows[0];
    if (!row) return res.status(404).json({ message: "Practical not found" });
    const course = (await pool.query("SELECT * FROM courses WHERE id=$1", [row.course_id])).rows[0];
    return res.json(out(row, engine.view(row.state, Date.now()), {
      rules: await rulesFor(course, row.enrollment_id), course: { id: course.id, title: course.title },
      result: row.finished_at ? resultOf(row) : null,
    }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/learn/practical/:sid/act  { action } ───────────────────────────
// One thing the learner did. The row is locked for the length of it, so two
// clicks in flight can never both apply to the same starting state.
const act = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = (await client.query("SELECT * FROM practical_sessions WHERE id=$1 AND user_id=$2 FOR UPDATE", [req.params.sid, req.user.id])).rows[0];
    if (!row) { await client.query("ROLLBACK"); return res.status(404).json({ message: "Practical not found" }); }
    if (row.finished_at) { await client.query("ROLLBACK"); return res.status(409).json({ message: "This practical is already finished." }); }

    const now = Date.now(), state = row.state;
    let feedback;
    try { feedback = engine.act(state, req.body?.action, now); }
    catch (e) {
      await client.query("ROLLBACK");
      if (e.status === 400) return res.status(400).json({ message: e.message });
      throw e;
    }

    const course = (await client.query("SELECT * FROM courses WHERE id=$1", [row.course_id])).rows[0];
    let result = null, certificate = null;
    if (state.done) {
      const g = engine.grade(state, await rulesFor(course, row.enrollment_id, client));
      await client.query(
        `UPDATE practical_sessions SET state=$1, last_action_at=NOW(), finished_at=NOW(), score=$2, passed=$3, critical=$4,
                theory_score=$5, final_score=$6, grading=$7 WHERE id=$8`,
        [JSON.stringify(state), g.score, row.mode === "exam" ? g.passed : null, g.critical, g.theory, g.final, JSON.stringify(g), row.id]
      );
      if (row.mode === "exam") {
        await client.query(
          `UPDATE enrollments SET status = CASE WHEN status = 'passed' OR $1 THEN 'passed' ELSE 'failed' END, updated_at=NOW() WHERE id=$2`,
          [g.passed, row.enrollment_id]
        );
      }
      await client.query("COMMIT");
      if (row.mode === "exam") {
        audit.record(req, "practical.finish", { target: course.title, details: { session: row.id, score: g.score, passed: g.passed, critical: g.critical } });
        // The certificate carries the final mark, theory and practical together.
        if (g.passed) certificate = await certificates.issue(req, course, g.final, { practical_session: row.id, practical: g.practical, theory: g.theory });
      }
      result = { ...resultOf({ ...row, state, score: g.score, passed: row.mode === "exam" ? g.passed : null, critical: g.critical, grading: g }), would_pass: g.passed, certificate };
    } else {
      await client.query("UPDATE practical_sessions SET state=$1, last_action_at=NOW() WHERE id=$2", [JSON.stringify(state), row.id]);
      await client.query("COMMIT");
    }

    // In an exam, mistakes are kept for the end. Practice explains them as they happen.
    const told = row.mode === "practice" ? feedback : feedback.filter((f) => f.kind === "info");
    return res.json({ view: engine.view(state, now), feedback: told, result });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* already closed */ }
    return res.status(500).json({ message: e.message });
  } finally { client.release(); }
};

function resultOf(row) {
  const s = engine.summary(row.state);
  return { score: row.score ?? s.score, passed: row.passed, critical: row.critical, abandoned: row.abandoned, grading: row.grading || null, crits: s.crits, deds: s.deds, log: s.log };
}

// How this course grades a run: the weights and pass marks, and the learner's
// best passing quiz score (null when the course has no quiz).
async function rulesFor(course, enrollmentId, db = pool) {
  const q = (await db.query(
    `SELECT (SELECT COUNT(*) FROM quiz_questions WHERE course_id=$1)::int AS questions,
            (SELECT MAX(score) FROM attempts WHERE enrollment_id=$2 AND passed) AS best`, [course.id, enrollmentId]
  )).rows[0];
  return {
    weight: course.practical_weight ?? 70, finalPass: course.final_pass_mark ?? 80,
    practicalMin: course.practical_pass_mark ?? 0, theory: q.questions > 0 ? (q.best ?? 0) : null,
  };
}

// ── Staff: the scenarios on offer, and the results to review ─────────────────

// GET /api/practicals/scenarios
const scenarios = (_req, res) => res.json(engine.list());

// A manager sees their own team only, as in Reporting.
async function teamIds(req) {
  if (req.user.role !== "manager") return null;
  const { rows } = await pool.query("SELECT id FROM users WHERE org_id=$1 AND team IS NOT DISTINCT FROM $2", [req.user.org_id, req.user.team]);
  return rows.map((r) => r.id);
}

// GET /api/practicals/results?course_id=&mode=exam|practice|all&status=passed|failed|critical|open
const results = async (req, res) => {
  try {
    const ids = await teamIds(req);
    const where = ["s.org_id = $1"], vals = [req.user.org_id];
    if (ids) { vals.push(ids); where.push(`s.user_id = ANY($${vals.length})`); }
    if (req.query.course_id) { vals.push(Number(req.query.course_id)); where.push(`s.course_id = $${vals.length}`); }
    const mode = req.query.mode || "exam";
    if (mode !== "all") { vals.push(mode === "practice" ? "practice" : "exam"); where.push(`s.mode = $${vals.length}`); }
    const status = req.query.status;
    if (status === "passed") where.push("s.passed IS TRUE");
    else if (status === "failed") where.push("s.finished_at IS NOT NULL AND s.passed IS NOT TRUE");
    else if (status === "critical") where.push("s.critical IS TRUE");
    else if (status === "open") where.push("s.finished_at IS NULL");
    const { rows } = await pool.query(
      `SELECT s.id, s.mode, s.score, s.theory_score, s.final_score, s.passed, s.critical, s.abandoned, s.started_at, s.finished_at, s.reviewed_at,
              s.state AS state, s.state->'crits'->0->>'reason' AS first_critical,
              u.id AS user_id, u.name AS learner, u.job_title, u.team, c.id AS course_id, c.title AS course
         FROM practical_sessions s
         JOIN users u ON u.id = s.user_id
         JOIN courses c ON c.id = s.course_id
        WHERE ${where.join(" AND ")}
        ORDER BY COALESCE(s.finished_at, s.last_action_at) DESC
        LIMIT 500`, vals
    );
    return res.json(rows.map(({ state, ...r }) => ({ ...r, patient: engine.subject(state) })));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// GET /api/practicals/results/:id
const resultDetail = async (req, res) => {
  try {
    const ids = await teamIds(req);
    const row = (await pool.query(
      `SELECT s.*, u.name AS learner, u.email, u.job_title, u.team, c.title AS course, c.practical_pass_mark, c.final_pass_mark, r.name AS reviewer
         FROM practical_sessions s
         JOIN users u ON u.id = s.user_id
         JOIN courses c ON c.id = s.course_id
         LEFT JOIN users r ON r.id = s.reviewed_by
        WHERE s.id = $1 AND s.org_id = $2`, [req.params.id, req.user.org_id]
    )).rows[0];
    if (!row || (ids && !ids.includes(row.user_id))) return res.status(404).json({ message: "Result not found" });
    const sc = engine.get(row.scenario_key);
    return res.json({
      id: row.id, mode: row.mode, learner: row.learner, email: row.email, job_title: row.job_title, team: row.team,
      course_id: row.course_id, course: row.course, scenario: sc?.title || row.scenario_key, pass_mark: row.final_pass_mark,
      theory_score: row.theory_score, final_score: row.final_score,
      subject: engine.subject(row.state),
      started_at: row.started_at, finished_at: row.finished_at, last_action_at: row.last_action_at,
      review_note: row.review_note, reviewer: row.reviewer, reviewed_at: row.reviewed_at,
      ...resultOf(row),
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// PATCH /api/practicals/results/:id/review  { note }
const review = async (req, res) => {
  try {
    const ids = await teamIds(req);
    const row = (await pool.query("SELECT id, user_id, course_id FROM practical_sessions WHERE id=$1 AND org_id=$2", [req.params.id, req.user.org_id])).rows[0];
    if (!row || (ids && !ids.includes(row.user_id))) return res.status(404).json({ message: "Result not found" });
    const note = String(req.body?.note || "").trim().slice(0, 2000) || null;
    await pool.query("UPDATE practical_sessions SET review_note=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3", [note, req.user.id, row.id]);
    audit.record(req, "practical.review", { target: `practical #${row.id}`, details: { note } });
    return res.json({ ok: true, review_note: note, reviewer: req.user.name, reviewed_at: new Date().toISOString() });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { start, get, act, scenarios, results, resultDetail, review };
