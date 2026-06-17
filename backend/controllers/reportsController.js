const pool = require("../config/db");

const DAY = 86_400_000;
const daysLeft = (until) => Math.ceil((new Date(until).getTime() - Date.now()) / DAY);

// ── GET /api/reports/summary ─────────────────────────────────────────────────
// Org-wide compliance figures + a per-course breakdown.
const summary = async (req, res) => {
  const org = req.user.org_id;
  try {
    const { rows: [t] } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE org_id=$1)                                         AS people,
         (SELECT COUNT(*) FROM courses WHERE org_id=$1 AND status='published')                AS courses,
         (SELECT COUNT(*) FROM certificates WHERE org_id=$1)                                  AS certificates,
         (SELECT COUNT(DISTINCT user_id) FROM certificates
            WHERE org_id=$1 AND (certified_until IS NULL OR certified_until > NOW()))         AS certified_people,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL
              AND certified_until > NOW() AND certified_until <= NOW()+INTERVAL '30 days')    AS expiring_soon,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL AND certified_until < NOW())      AS expired`,
      [org]
    );
    const { rows: byCourse } = await pool.query(
      `SELECT c.id, c.title, c.pass_mark,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id)                       AS enrolled,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id AND e.status='passed') AS passed,
              (SELECT COUNT(*) FROM certificates ct WHERE ct.course_id=c.id)                    AS certificates,
              (SELECT ROUND(AVG(e.best_score)) FROM enrollments e
                 WHERE e.course_id=c.id AND e.best_score IS NOT NULL)                           AS avg_score
       FROM courses c WHERE c.org_id=$1 AND c.status='published' ORDER BY c.title`,
      [org]
    );
    return res.json({
      totals: {
        people: +t.people, courses: +t.courses, certificates: +t.certificates,
        certified_people: +t.certified_people, expiring_soon: +t.expiring_soon, expired: +t.expired,
      },
      by_course: byCourse.map((r) => ({
        id: r.id, title: r.title, pass_mark: r.pass_mark,
        enrolled: +r.enrolled, passed: +r.passed, certificates: +r.certificates,
        avg_score: r.avg_score == null ? null : +r.avg_score,
        completion: +r.enrolled ? Math.round((+r.passed / +r.enrolled) * 100) : 0,
      })),
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/expiring?days=30 ────────────────────────────────────────
// Certificates already expired or expiring within `days`, soonest first.
const expiring = async (req, res) => {
  const org = req.user.org_id;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  try {
    const { rows } = await pool.query(
      `SELECT cert.serial, cert.certified_until, cert.score,
              u.name AS learner, u.email, u.external_id, c.title AS course
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1 AND cert.certified_until IS NOT NULL
         AND cert.certified_until <= NOW() + ($2 || ' days')::interval
       ORDER BY cert.certified_until ASC`,
      [org, days]
    );
    return res.json(rows.map((r) => {
      const dl = daysLeft(r.certified_until);
      return {
        serial: r.serial, learner: r.learner, email: r.email, external_id: r.external_id,
        course: r.course, score: r.score, certified_until: r.certified_until,
        days_left: dl, status: dl < 0 ? "expired" : "expiring",
      };
    }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/register ────────────────────────────────────────────────
// Every certificate in the org (the Certificates admin page). Optional ?q= search.
const register = async (req, res) => {
  const org = req.user.org_id;
  const q = req.query.q ? `%${req.query.q.toLowerCase()}%` : null;
  const params = [org];
  let filter = "";
  if (q) { params.push(q); filter = ` AND (LOWER(u.name) LIKE $2 OR LOWER(c.title) LIKE $2 OR LOWER(cert.serial) LIKE $2)`; }
  try {
    const { rows } = await pool.query(
      `SELECT cert.serial, cert.score, cert.issued_at, cert.certified_until,
              u.name AS learner, u.email, u.external_id, c.title AS course
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1${filter}
       ORDER BY cert.issued_at DESC`,
      params
    );
    return res.json(rows.map((r) => {
      const dl = r.certified_until ? daysLeft(r.certified_until) : null;
      return {
        serial: r.serial, learner: r.learner, email: r.email, external_id: r.external_id,
        course: r.course, score: r.score, issued_at: r.issued_at, certified_until: r.certified_until,
        days_left: dl, status: dl == null ? "valid" : dl < 0 ? "expired" : "valid",
      };
    }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/certifications.csv ──────────────────────────────────────
// The full certification register as CSV (compliance / MoH export).
const exportCsv = async (req, res) => {
  const org = req.user.org_id;
  try {
    const { rows } = await pool.query(
      `SELECT u.name AS learner, u.email, u.external_id, u.job_title,
              c.title AS course, cert.serial, cert.score, cert.issued_at, cert.certified_until
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1 ORDER BY u.name, c.title`,
      [org]
    );
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Learner", "Email", "External ID", "Job title", "Course", "Serial", "Score", "Issued", "Certified until", "Status"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const status = !r.certified_until ? "valid" : (new Date(r.certified_until) < new Date() ? "expired" : "valid");
      lines.push([
        r.learner, r.email, r.external_id, r.job_title, r.course, r.serial,
        r.score, r.issued_at?.toISOString?.().slice(0, 10) || r.issued_at,
        r.certified_until ? (r.certified_until.toISOString?.().slice(0, 10) || r.certified_until) : "No expiry",
        status,
      ].map(esc).join(","));
    }
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="certifications-${new Date().toISOString().slice(0,10)}.csv"`);
    return res.send(lines.join("\n"));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { summary, expiring, register, exportCsv };
