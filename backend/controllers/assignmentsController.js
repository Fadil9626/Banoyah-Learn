const pool = require("../config/db");
const audit = require("../lib/audit");

// Derive a status string from the joined enrollment/cert/due columns.
function statusOf(r) {
  if (r.completed) return "completed";
  const overdue = r.due_date && new Date(r.due_date) < new Date();
  if (r.enrollment_status === "in_progress" || r.enrollment_status === "failed" || r.progress_pct > 0)
    return overdue ? "overdue" : "in_progress";
  return overdue ? "overdue" : "not_started";
}

// ── POST /api/assignments ────────────────────────────────────────────────────
// Assign a course to specific users and/or every learner. Idempotent (upsert).
// Body: { course_id, user_ids?: [int], all_learners?: bool, due_date?: "YYYY-MM-DD" }
const assign = async (req, res) => {
  const { course_id, user_ids, all_learners, due_date } = req.body;
  if (!course_id) return res.status(400).json({ message: "course_id is required" });
  try {
    const course = (await pool.query("SELECT id FROM courses WHERE id=$1 AND org_id=$2", [course_id, req.user.org_id])).rows[0];
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Resolve target user ids (must belong to the org).
    const ids = new Set();
    if (Array.isArray(user_ids)) {
      const { rows } = await pool.query("SELECT id FROM users WHERE org_id=$1 AND id = ANY($2)", [req.user.org_id, user_ids.map(Number)]);
      rows.forEach((r) => ids.add(r.id));
    }
    if (all_learners) {
      const { rows } = await pool.query("SELECT id FROM users WHERE org_id=$1 AND role='learner'", [req.user.org_id]);
      rows.forEach((r) => ids.add(r.id));
    }
    if (!ids.size) return res.status(400).json({ message: "No valid users to assign" });

    const due = due_date || null;
    let count = 0;
    for (const uid of ids) {
      await pool.query(
        `INSERT INTO assignments (org_id, course_id, user_id, due_date, assigned_by)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (course_id, user_id)
         DO UPDATE SET due_date=EXCLUDED.due_date, last_reminder_day=NULL`,
        [req.user.org_id, course_id, uid, due, req.user.id]
      );
      count++;
    }
    audit.record(req, "assignment.create", { details: { course_id, assigned: count, due_date: due } });
    return res.status(201).json({ assigned: count });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/assignments/course/:courseId ────────────────────────────────────
// Who's assigned to a course + each person's progress (admin/instructor view).
const listForCourse = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.due_date, u.name, u.email, u.external_id,
              e.status AS enrollment_status, e.progress_pct,
              (cert.id IS NOT NULL AND (cert.certified_until IS NULL OR cert.certified_until > NOW())) AS completed
       FROM assignments a
       JOIN users u ON u.id=a.user_id
       LEFT JOIN enrollments e ON e.user_id=a.user_id AND e.course_id=a.course_id
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
       WHERE a.course_id=$1 AND a.org_id=$2
       ORDER BY u.name`,
      [req.params.courseId, req.user.org_id]
    );
    return res.json(rows.map((r) => ({
      id: r.id, name: r.name, email: r.email, external_id: r.external_id,
      due_date: r.due_date, progress_pct: r.progress_pct || 0, status: statusOf(r),
    })));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/assignments/me ──────────────────────────────────────────────────
// The caller's assigned (published) courses with due dates + status.
const mine = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.due_date, c.id AS course_id, c.title, c.category,
              e.status AS enrollment_status, e.progress_pct,
              (cert.id IS NOT NULL AND (cert.certified_until IS NULL OR cert.certified_until > NOW())) AS completed
       FROM assignments a
       JOIN courses c ON c.id=a.course_id AND c.status='published'
       LEFT JOIN enrollments e ON e.user_id=a.user_id AND e.course_id=a.course_id
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
       WHERE a.user_id=$1
       ORDER BY a.due_date NULLS LAST, c.title`,
      [req.user.id]
    );
    return res.json(rows.map((r) => ({
      id: r.id, course_id: r.course_id, title: r.title, category: r.category,
      due_date: r.due_date, progress_pct: r.progress_pct || 0, status: statusOf(r),
    })));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── DELETE /api/assignments/:id ──────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query("DELETE FROM assignments WHERE id=$1 AND org_id=$2", [req.params.id, req.user.org_id]);
    if (!rowCount) return res.status(404).json({ message: "Assignment not found" });
    return res.json({ message: "Unassigned" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { assign, listForCourse, mine, remove };
