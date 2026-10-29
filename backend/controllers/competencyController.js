// Competency: who is signed off on which practical, who is due or lapsed, and
// where staff lose points. Built from what is already recorded (certificates,
// practical runs, enrolments); nothing here is stored separately.
const pool = require("../config/db");
const engine = require("../lib/practical/engine");

const DAY = 86_400_000;

// A manager sees their own team only, as everywhere else.
async function teamIds(req) {
  if (req.user.role !== "manager") return null;
  const { rows } = await pool.query("SELECT id FROM users WHERE org_id=$1 AND team IS NOT DISTINCT FROM $2", [req.user.org_id, req.user.team]);
  return rows.map((r) => r.id);
}

// "Due" means inside the earliest reminder the organisation sends: if reminders
// go out 30, 7 and 1 days before expiry, a certificate is due from 30 days out.
async function dueWindow(orgId) {
  const v = (await pool.query("SELECT value FROM org_settings WHERE org_id=$1 AND key='reminder_days'", [orgId])).rows[0]?.value || "30,7,1";
  return Math.max(1, ...String(v).split(",").map((n) => parseInt(n, 10)).filter((n) => n > 0));
}

/**
 * The state of one person on one practical course.
 *   competent · due · expired · failed · in_progress · not_started
 * A valid certificate decides it; then a lapsed one; then the last exam; then
 * whether they have begun at all.
 */
function cellFor({ cert, exam, begun }, due, now = Date.now()) {
  const base = { session_id: exam?.id ?? null, score: exam?.final_score ?? exam?.score ?? null, critical: !!exam?.critical, attempts: exam?.attempts || 0 };
  if (cert) {
    const until = cert.certified_until ? new Date(cert.certified_until).getTime() : null;
    const days = until == null ? null : Math.ceil((until - now) / DAY);
    if (until == null || days > 0) return { ...base, status: days != null && days <= due ? "due" : "competent", until: cert.certified_until, days, serial: cert.serial };
    return { ...base, status: "expired", until: cert.certified_until, days, serial: cert.serial };
  }
  if (exam && exam.passed === false) return { ...base, status: "failed" };
  if (begun) return { ...base, status: "in_progress" };
  return { ...base, status: "not_started" };
}

// ── GET /api/practicals/competency ───────────────────────────────────────────
const matrix = async (req, res) => {
  try {
    const org = req.user.org_id, ids = await teamIds(req), due = await dueWindow(org);
    const courses = (await pool.query(
      `SELECT id, title, practical_key, validity_months FROM courses
        WHERE org_id=$1 AND status='published' AND practical_key IS NOT NULL ORDER BY title`, [org]
    )).rows.filter((c) => engine.get(c.practical_key));
    const scope = ids ? " AND u.id = ANY($2)" : "", vals = ids ? [org, ids] : [org];
    const people = (await pool.query(
      `SELECT u.id, u.name, u.job_title, u.team FROM users u WHERE u.org_id=$1 AND u.is_active${scope} ORDER BY u.name`, vals
    )).rows;
    const cids = courses.map((c) => c.id), uids = people.map((p) => p.id);
    if (!cids.length || !uids.length) return res.json({ courses, people: people.map((p) => ({ ...p, cells: {} })), due_days: due, counts: {} });

    // The newest certificate, the last finished exam (and how many there were),
    // and whether anything has been started, for each person and course.
    const certs = (await pool.query(
      `SELECT DISTINCT ON (user_id, course_id) user_id, course_id, serial, certified_until
         FROM certificates WHERE org_id=$1 AND course_id = ANY($2) AND user_id = ANY($3)
        ORDER BY user_id, course_id, issued_at DESC`, [org, cids, uids]
    )).rows;
    const exams = (await pool.query(
      `SELECT DISTINCT ON (user_id, course_id) id, user_id, course_id, passed, critical, score, final_score,
              COUNT(*) OVER (PARTITION BY user_id, course_id) AS attempts
         FROM practical_sessions
        WHERE org_id=$1 AND course_id = ANY($2) AND user_id = ANY($3) AND mode='exam' AND finished_at IS NOT NULL
        ORDER BY user_id, course_id, finished_at DESC`, [org, cids, uids]
    )).rows;
    const begun = (await pool.query(
      `SELECT user_id, course_id FROM enrollments WHERE org_id=$1 AND course_id = ANY($2) AND user_id = ANY($3)
       UNION SELECT user_id, course_id FROM practical_sessions WHERE org_id=$1 AND course_id = ANY($2) AND user_id = ANY($3)`, [org, cids, uids]
    )).rows;
    const k = (u, c) => `${u}:${c}`;
    const C = new Map(certs.map((r) => [k(r.user_id, r.course_id), r]));
    const E = new Map(exams.map((r) => [k(r.user_id, r.course_id), { ...r, attempts: Number(r.attempts) }]));
    const S = new Set(begun.map((r) => k(r.user_id, r.course_id)));

    const counts = { competent: 0, due: 0, expired: 0, failed: 0, in_progress: 0, not_started: 0 };
    const rows = people.map((p) => {
      const cells = {};
      for (const c of courses) {
        const cell = cellFor({ cert: C.get(k(p.id, c.id)), exam: E.get(k(p.id, c.id)), begun: S.has(k(p.id, c.id)) }, due);
        cells[c.id] = cell; counts[cell.status]++;
      }
      return { ...p, cells };
    });
    return res.json({
      courses: courses.map((c) => ({ id: c.id, title: c.title, code: engine.get(c.practical_key).title.split(" · ")[0], validity_months: c.validity_months })),
      people: rows, due_days: due, counts,
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// The same mistake reads slightly differently from run to run ("on for 80
// seconds", "on for 95 seconds"): numbers are set aside to group them.
const shape = (s) => String(s || "").replace(/\d+(\.\d+)?/g, "#").trim();

/**
 * Where points go in a set of finished exam runs: each distinct mistake, how
 * many runs made it, and whether it is a critical error. Pure: takes the runs'
 * stored states, so it can be tested without a database.
 */
function weakPoints(states, limit = 8) {
  const groups = new Map();
  for (const st of states) {
    const seen = new Set();
    for (const c of st.crits || []) {
      const key = `C|${c.step}|${shape(c.reason)}`; if (seen.has(key)) continue; seen.add(key);
      const g = groups.get(key) || { step: c.step, text: c.reason, critical: true, runs: 0, points: null };
      g.runs++; groups.set(key, g);
    }
    for (const d of st.deds || []) {
      const key = `D|${d.step}|${shape(d.note)}`; if (seen.has(key)) continue; seen.add(key);
      const g = groups.get(key) || { step: d.step, text: d.note, critical: false, runs: 0, points: d.delta };
      g.runs++; groups.set(key, g);
    }
  }
  const n = states.length;
  return [...groups.values()]
    .map((g) => ({ ...g, pct: n ? Math.round((g.runs / n) * 100) : 0 }))
    .sort((a, b) => b.critical - a.critical || b.runs - a.runs || (a.points ?? 0) - (b.points ?? 0))
    .slice(0, limit);
}

// ── GET /api/practicals/weak-points ──────────────────────────────────────────
// Per practical course: the commonest mistakes in the last 500 finished exams.
const weak = async (req, res) => {
  try {
    const org = req.user.org_id, ids = await teamIds(req);
    const courses = (await pool.query(
      "SELECT id, title, practical_key FROM courses WHERE org_id=$1 AND status='published' AND practical_key IS NOT NULL ORDER BY title", [org]
    )).rows.filter((c) => engine.get(c.practical_key));
    const out = [];
    for (const c of courses) {
      const vals = [org, c.id], scope = ids ? (vals.push(ids), " AND user_id = ANY($3)") : "";
      const runs = (await pool.query(
        `SELECT state, passed FROM practical_sessions
          WHERE org_id=$1 AND course_id=$2 AND mode='exam' AND finished_at IS NOT NULL AND NOT abandoned${scope}
          ORDER BY finished_at DESC LIMIT 500`, vals
      )).rows;
      out.push({
        course_id: c.id, title: c.title, code: engine.get(c.practical_key).title.split(" · ")[0],
        exams: runs.length, passed: runs.filter((r) => r.passed).length, clean: runs.filter((r) => !(r.state.crits?.length || r.state.deds?.length)).length,
        items: weakPoints(runs.map((r) => r.state)),
      });
    }
    return res.json(out);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { matrix, weak, cellFor, weakPoints, teamIds };
