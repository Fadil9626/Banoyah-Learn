const pool = require("../config/db");

// ── GET /api/audit ───────────────────────────────────────────────────────────
// Paginated audit trail for the org. Filters: ?action=, ?q= (actor/target).
const list = async (req, res) => {
  const org = req.user.org_id;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const params = [org];
  let where = "org_id = $1";
  if (req.query.action) { params.push(req.query.action); where += ` AND action = $${params.length}`; }
  if (req.query.q) {
    params.push(`%${req.query.q.toLowerCase()}%`);
    where += ` AND (LOWER(actor_name) LIKE $${params.length} OR LOWER(target) LIKE $${params.length})`;
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, actor_name, action, target, details, ip, created_at
       FROM audit_log WHERE ${where} ORDER BY created_at DESC, id DESC
       LIMIT ${limit} OFFSET ${offset}`, params
    );
    const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) FROM audit_log WHERE ${where}`, params);
    // Distinct actions present, for the filter dropdown.
    const { rows: actions } = await pool.query("SELECT DISTINCT action FROM audit_log WHERE org_id=$1 ORDER BY action", [org]);
    return res.json({ rows, total: Number(count), actions: actions.map((a) => a.action) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { list };
