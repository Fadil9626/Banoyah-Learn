const pool = require("../config/db");
const { certificatePDF } = require("../lib/pdf");
const audit = require("../lib/audit");
const webhooks = require("../lib/webhooks");

const DAY = 86_400_000;
const daysLeft = (until) => Math.ceil((new Date(until).getTime() - Date.now()) / DAY);

// For a manager, the set of user ids in their team; null = no restriction.
async function teamIds(req) {
  if (req.user.role !== "manager") return null;
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE org_id=$1 AND team IS NOT DISTINCT FROM $2", [req.user.org_id, req.user.team]
  );
  return rows.map((r) => r.id);
}

// ── GET /api/reports/summary ─────────────────────────────────────────────────
const summary = async (req, res) => {
  const org = req.user.org_id;
  try {
    const ids = await teamIds(req);
    const params = ids ? [org, ids] : [org];
    const cf = ids ? " AND user_id = ANY($2)" : "";   // certificates filter
    const pf = ids ? " AND id = ANY($2)" : "";        // people filter
    const ef = ids ? " AND e.user_id = ANY($2)" : ""; // enrollments
    const ctf = ids ? " AND ct.user_id = ANY($2)" : "";

    const { rows: [t] } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE org_id=$1${pf})                                     AS people,
         (SELECT COUNT(*) FROM courses WHERE org_id=$1 AND status='published')                 AS courses,
         (SELECT COUNT(*) FROM certificates WHERE org_id=$1${cf})                              AS certificates,
         (SELECT COUNT(DISTINCT user_id) FROM certificates
            WHERE org_id=$1 AND (certified_until IS NULL OR certified_until > NOW())${cf})     AS certified_people,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL
              AND certified_until > NOW() AND certified_until <= NOW()+INTERVAL '30 days'${cf}) AS expiring_soon,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL AND certified_until < NOW()${cf})  AS expired`,
      params
    );
    const { rows: byCourse } = await pool.query(
      `SELECT c.id, c.title, c.pass_mark,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id${ef})                       AS enrolled,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id AND e.status='passed'${ef}) AS passed,
              (SELECT COUNT(*) FROM certificates ct WHERE ct.course_id=c.id${ctf})                   AS certificates,
              (SELECT ROUND(AVG(e.best_score)) FROM enrollments e
                 WHERE e.course_id=c.id AND e.best_score IS NOT NULL${ef})                           AS avg_score
       FROM courses c WHERE c.org_id=$1 AND c.status='published' ORDER BY c.title`,
      params
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
const expiring = async (req, res) => {
  const org = req.user.org_id;
  const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
  try {
    const ids = await teamIds(req);
    const params = ids ? [org, days, ids] : [org, days];
    const tf = ids ? " AND cert.user_id = ANY($3)" : "";
    const { rows } = await pool.query(
      `SELECT cert.serial, cert.certified_until, cert.score,
              u.name AS learner, u.email, u.external_id, c.title AS course
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1 AND cert.certified_until IS NOT NULL
         AND cert.certified_until <= NOW() + ($2 || ' days')::interval${tf}
       ORDER BY cert.certified_until ASC`,
      params
    );
    return res.json(rows.map((r) => {
      const dl = daysLeft(r.certified_until);
      return { serial: r.serial, learner: r.learner, email: r.email, external_id: r.external_id,
        course: r.course, score: r.score, certified_until: r.certified_until,
        days_left: dl, status: dl < 0 ? "expired" : "expiring" };
    }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/assignments ─────────────────────────────────────────────
const assignmentCompliance = async (req, res) => {
  const org = req.user.org_id;
  const COMPLETED = "(cert.id IS NOT NULL AND (cert.certified_until IS NULL OR cert.certified_until > NOW()))";
  const OVERDUE = `(NOT ${COMPLETED} AND a.due_date IS NOT NULL AND a.due_date < CURRENT_DATE)`;
  try {
    const ids = await teamIds(req);
    const params = ids ? [org, ids] : [org];
    const af = ids ? " AND a.user_id = ANY($2)" : "";
    const { rows: [t] } = await pool.query(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE ${COMPLETED}) AS completed,
              COUNT(*) FILTER (WHERE ${OVERDUE})   AS overdue
       FROM assignments a
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
       WHERE a.org_id=$1${af}`, params
    );
    const { rows: byCourse } = await pool.query(
      `SELECT c.id, c.title,
              COUNT(a.id) AS assigned,
              COUNT(*) FILTER (WHERE ${COMPLETED}) AS completed,
              COUNT(*) FILTER (WHERE ${OVERDUE})   AS overdue
       FROM assignments a
       JOIN courses c ON c.id=a.course_id
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
       WHERE a.org_id=$1${af}
       GROUP BY c.id, c.title ORDER BY c.title`, params
    );
    const { rows: overdue } = await pool.query(
      `SELECT u.name AS learner, u.email, u.external_id, c.title AS course, a.due_date
       FROM assignments a
       JOIN users u ON u.id=a.user_id
       JOIN courses c ON c.id=a.course_id
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
       WHERE a.org_id=$1 AND a.due_date IS NOT NULL AND a.due_date < CURRENT_DATE
         AND NOT ${COMPLETED}${af}
       ORDER BY a.due_date ASC LIMIT 100`, params
    );
    return res.json({
      totals: { total: +t.total, completed: +t.completed, overdue: +t.overdue },
      by_course: byCourse.map((r) => ({
        id: r.id, title: r.title, assigned: +r.assigned, completed: +r.completed, overdue: +r.overdue,
        completion: +r.assigned ? Math.round((+r.completed / +r.assigned) * 100) : 0,
      })),
      overdue: overdue.map((r) => ({
        learner: r.learner, email: r.email, external_id: r.external_id, course: r.course,
        due_date: r.due_date, days_overdue: Math.max(0, -daysLeft(r.due_date)),
      })),
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/register ────────────────────────────────────────────────
const register = async (req, res) => {
  const org = req.user.org_id;
  try {
    const ids = await teamIds(req);
    const params = [org];
    let filter = "";
    if (ids) { params.push(ids); filter += ` AND cert.user_id = ANY($${params.length})`; }
    if (req.query.q) {
      params.push(`%${req.query.q.toLowerCase()}%`);
      filter += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(c.title) LIKE $${params.length} OR LOWER(cert.serial) LIKE $${params.length})`;
    }
    const { rows } = await pool.query(
      `SELECT cert.serial, cert.score, cert.issued_at, cert.certified_until,
              u.name AS learner, u.email, u.external_id, c.title AS course
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1${filter}
       ORDER BY cert.issued_at DESC`, params
    );
    return res.json(rows.map((r) => {
      const dl = r.certified_until ? daysLeft(r.certified_until) : null;
      return { serial: r.serial, learner: r.learner, email: r.email, external_id: r.external_id,
        course: r.course, score: r.score, issued_at: r.issued_at, certified_until: r.certified_until,
        days_left: dl, status: dl == null ? "valid" : dl < 0 ? "expired" : "valid" };
    }));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/reports/certifications.csv ──────────────────────────────────────
const exportCsv = async (req, res) => {
  const org = req.user.org_id;
  try {
    const ids = await teamIds(req);
    const params = ids ? [org, ids] : [org];
    const tf = ids ? " AND cert.user_id = ANY($2)" : "";
    const { rows } = await pool.query(
      `SELECT u.name AS learner, u.email, u.external_id, u.job_title, u.team,
              c.title AS course, cert.serial, cert.score, cert.issued_at, cert.certified_until
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       WHERE cert.org_id=$1${tf} ORDER BY u.name, c.title`, params
    );
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = ["Learner", "Email", "External ID", "Job title", "Team", "Course", "Serial", "Score", "Issued", "Certified until", "Status"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const status = !r.certified_until ? "valid" : (new Date(r.certified_until) < new Date() ? "expired" : "valid");
      lines.push([
        r.learner, r.email, r.external_id, r.job_title, r.team, r.course, r.serial,
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

// ── GET /api/reports/certificates/:serial/pdf ────────────────────────────────
// Admin/instructor/manager view of ANY certificate in their org (team-scoped
// for managers). Unlike the learner endpoint this is not bound to req.user.id.
const certificatePdf = async (req, res) => {
  const org = req.user.org_id;
  try {
    const ids = await teamIds(req);
    const params = [req.params.serial, org];
    let filter = "";
    if (ids) { params.push(ids); filter = ` AND cert.user_id = ANY($${params.length})`; }
    const { rows } = await pool.query(
      `SELECT cert.*, c.title AS course_title, u.name AS learner_name, o.name AS org_name
       FROM certificates cert
       JOIN courses c ON c.id=cert.course_id
       JOIN users u ON u.id=cert.user_id
       JOIN organizations o ON o.id=cert.org_id
       WHERE cert.serial=$1 AND cert.org_id=$2${filter}`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: "Certificate not found" });
    const { rows: br } = await pool.query(
      "SELECT key, value FROM org_settings WHERE org_id=$1 AND key IN ('brand_accent','brand_logo')", [org]
    );
    const m = Object.fromEntries(br.map((r) => [r.key, r.value]));
    const safe = String(rows[0].course_title).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const verifyUrl = `${req.protocol}://${req.get("host")}/verify/${rows[0].serial}`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${safe}-${rows[0].serial}.pdf"`);
    certificatePDF({ ...rows[0], brand_accent: m.brand_accent || "#4F46E5", brand_logo: m.brand_logo || "", verify_url: verifyUrl }, res);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── DELETE /api/reports/certificates/:serial ─────────────────────────────────
// Revoke (delete) a certificate. Admin-only — destructive and irreversible.
// Records an audit entry and fires a `certification.revoked` webhook.
const revoke = async (req, res) => {
  const org = req.user.org_id;
  try {
    const { rows } = await pool.query(
      `DELETE FROM certificates cert
       USING users u, courses c
       WHERE cert.serial=$1 AND cert.org_id=$2 AND u.id=cert.user_id AND c.id=cert.course_id
       RETURNING cert.serial, cert.score, cert.issued_at, cert.certified_until,
                 u.name AS learner, u.email, u.external_id, c.id AS course_id, c.title AS course`,
      [req.params.serial, org]
    );
    if (!rows.length) return res.status(404).json({ message: "Certificate not found" });
    const r = rows[0];
    audit.record(req, "certification.revoke", { target: r.serial, details: { learner: r.email, course: r.course } });
    webhooks.emit(org, "certification.revoked", {
      serial: r.serial, email: r.email, external_id: r.external_id,
      course_id: r.course_id, course: r.course, learner: r.learner,
    });
    return res.json({ revoked: true, serial: r.serial });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { summary, expiring, assignmentCompliance, register, exportCsv, certificatePdf, revoke };
