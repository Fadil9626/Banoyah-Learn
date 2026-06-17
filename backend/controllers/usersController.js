const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const publicUser = (u) => ({
  id: u.id, org_id: u.org_id, name: u.name, email: u.email, role: u.role,
  job_title: u.job_title, external_id: u.external_id, is_active: u.is_active,
  created_at: u.created_at,
});

// ── GET /api/users ─────────────────────────────────────────────────────────
// All users in the caller's organization. Optional ?role= and ?q= filters.
const list = async (req, res) => {
  const params = [req.user.org_id];
  let where = "org_id = $1";
  if (req.query.role) { params.push(req.query.role); where += ` AND role = $${params.length}`; }
  if (req.query.q) {
    params.push(`%${req.query.q.toLowerCase()}%`);
    where += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
  }
  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT 500`, params
    );
    return res.json(rows.map(publicUser));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/users ────────────────────────────────────────────────────────
// Create a learner/instructor/admin within the org. A password is optional —
// learners provisioned for tracking need not log in.
const create = async (req, res) => {
  const { name, email, role, job_title, external_id, password } = req.body;
  if (!name || !email) return res.status(400).json({ message: "name and email are required" });
  const allowed = ["admin", "instructor", "learner"];
  const r = allowed.includes(role) ? role : "learner";
  try {
    const hash = password ? await bcrypt.hash(password, 12) : null;
    const { rows } = await pool.query(
      `INSERT INTO users (org_id, name, email, role, job_title, external_id, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.org_id, name, email.toLowerCase().trim(), r, job_title || null, external_id || null, hash]
    );
    return res.status(201).json(publicUser(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "A user with that email or external ID already exists" });
    return res.status(500).json({ message: e.message });
  }
};

// ── PATCH /api/users/:id ───────────────────────────────────────────────────
const update = async (req, res) => {
  const fields = [];
  const vals = [];
  let i = 1;
  for (const key of ["name", "role", "job_title", "external_id", "is_active"]) {
    if (req.body[key] !== undefined) { fields.push(`${key}=$${i++}`); vals.push(req.body[key]); }
  }
  if (req.body.password) { fields.push(`password_hash=$${i++}`); vals.push(await bcrypt.hash(req.body.password, 12)); }
  if (!fields.length) return res.status(400).json({ message: "Nothing to update" });
  vals.push(req.params.id, req.user.org_id);
  try {
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(", ")}, updated_at=NOW()
       WHERE id=$${i++} AND org_id=$${i} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json(publicUser(rows[0]));
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Duplicate email or external ID" });
    return res.status(500).json({ message: e.message });
  }
};

module.exports = { list, create, update };
