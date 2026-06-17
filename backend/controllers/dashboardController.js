const pool = require("../config/db");

// ── GET /api/dashboard ───────────────────────────────────────────────────────
// Role-aware overview. Learners get their own to-do/achievements; staff get an
// org-wide compliance snapshot plus recent activity.
const summary = async (req, res) => {
  const org = req.user.org_id;
  const uid = req.user.id;
  try {
    if (req.user.role === "learner") {
      const assigned = (await pool.query(
        `SELECT a.due_date, c.id AS course_id, c.title,
                (cert.id IS NOT NULL AND (cert.certified_until IS NULL OR cert.certified_until > NOW())) AS completed
         FROM assignments a
         JOIN courses c ON c.id=a.course_id AND c.status='published'
         LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
         WHERE a.user_id=$1 ORDER BY a.due_date NULLS LAST, c.title`, [uid]
      )).rows;
      const todo = assigned.filter((x) => !x.completed);
      const counts = (await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM certificates WHERE user_id=$1) AS certificates,
           (SELECT COUNT(*) FROM enrollments WHERE user_id=$1 AND status='passed') AS completed,
           (SELECT COUNT(*) FROM enrollments WHERE user_id=$1 AND status='in_progress') AS in_progress`, [uid]
      )).rows[0];
      return res.json({
        role: "learner",
        stats: { todo: todo.length, certificates: +counts.certificates, completed: +counts.completed, in_progress: +counts.in_progress },
        required: todo.slice(0, 5).map((x) => ({
          course_id: x.course_id, title: x.title, due_date: x.due_date,
          overdue: !!x.due_date && new Date(x.due_date) < new Date(),
        })),
      });
    }

    // Staff / admin overview (managers see their team only).
    const ids = req.user.role === "manager"
      ? (await pool.query("SELECT id FROM users WHERE org_id=$1 AND team IS NOT DISTINCT FROM $2", [org, req.user.team])).rows.map((r) => r.id)
      : null;
    const params = ids ? [org, ids] : [org];
    const pf = ids ? " AND id = ANY($2)" : "";
    const cf = ids ? " AND user_id = ANY($2)" : "";
    const af = ids ? " AND a.user_id = ANY($2)" : "";
    const { rows: [t] } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE org_id=$1${pf})                                        AS people,
         (SELECT COUNT(*) FROM courses WHERE org_id=$1 AND status='published')                   AS courses,
         (SELECT COUNT(*) FROM certificates WHERE org_id=$1${cf})                                 AS certificates,
         (SELECT COUNT(DISTINCT user_id) FROM certificates
            WHERE org_id=$1 AND (certified_until IS NULL OR certified_until > NOW())${cf})        AS certified_people,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL
              AND certified_until > NOW() AND certified_until <= NOW()+INTERVAL '30 days'${cf})    AS expiring_soon,
         (SELECT COUNT(*) FROM certificates
            WHERE org_id=$1 AND certified_until IS NOT NULL AND certified_until < NOW()${cf})     AS expired,
         (SELECT COUNT(*) FROM assignments a WHERE a.org_id=$1${af})                              AS assigned_total,
         (SELECT COUNT(*) FROM assignments a
            LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
            WHERE a.org_id=$1 AND cert.id IS NOT NULL
              AND (cert.certified_until IS NULL OR cert.certified_until > NOW())${af})            AS assigned_done,
         (SELECT COUNT(*) FROM assignments a
            LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
              AND (cert.certified_until IS NULL OR cert.certified_until > NOW())
            WHERE a.org_id=$1 AND a.due_date IS NOT NULL AND a.due_date < CURRENT_DATE
              AND cert.id IS NULL${af})                                                           AS assigned_overdue`,
      params
    );
    // Managers don't see org-wide activity (only admins do).
    const recent = req.user.role === "manager" ? [] : (await pool.query(
      "SELECT actor_name, action, target, created_at FROM audit_log WHERE org_id=$1 ORDER BY created_at DESC, id DESC LIMIT 8", [org]
    )).rows;
    return res.json({
      role: "staff",
      totals: {
        people: +t.people, courses: +t.courses, certificates: +t.certificates,
        certified_people: +t.certified_people, expiring_soon: +t.expiring_soon, expired: +t.expired,
        assigned_total: +t.assigned_total, assigned_done: +t.assigned_done, assigned_overdue: +t.assigned_overdue,
      },
      recent,
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { summary };
