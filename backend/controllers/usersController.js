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

// ── CSV import ───────────────────────────────────────────────────────────────
// A small RFC-4180-ish parser: handles quoted fields, embedded commas/newlines,
// and "" escaping. Returns an array of string arrays.
function parseCsv(text) {
  const rows = [];
  let field = "", row = [], inQuotes = false, i = 0;
  const endField = () => { row.push(field); field = ""; };
  const endRow = () => { endField(); rows.push(row); row = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { endField(); i++; continue; }
    if (ch === "\r") { i++; continue; }
    if (ch === "\n") { endRow(); i++; continue; }
    field += ch; i++;
  }
  if (field.length || row.length) endRow();
  // Drop blank lines.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const HEADER_ALIASES = {
  name: ["name", "full name", "fullname"],
  email: ["email", "e-mail", "email address"],
  role: ["role"],
  job_title: ["job_title", "job title", "title", "position"],
  external_id: ["external_id", "external id", "staff id", "staff_id", "id"],
};

// ── POST /api/users/import ───────────────────────────────────────────────────
// Body: { csv: "<raw csv text>" }. First row is the header. Existing emails are
// skipped (not errors). Returns { created, skipped, errors:[{row,reason}] }.
const importUsers = async (req, res) => {
  const csv = req.body.csv;
  if (!csv || typeof csv !== "string") return res.status(400).json({ message: "csv text is required" });
  const rows = parseCsv(csv);
  if (rows.length < 2) return res.status(400).json({ message: "CSV needs a header row and at least one data row" });

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (key) => header.findIndex((h) => HEADER_ALIASES[key].includes(h));
  const ci = { name: col("name"), email: col("email"), role: col("role"), job_title: col("job_title"), external_id: col("external_id") };
  if (ci.name === -1 || ci.email === -1) return res.status(400).json({ message: "CSV must include 'name' and 'email' columns" });

  const get = (row, idx) => (idx >= 0 && row[idx] != null ? String(row[idx]).trim() : "");
  let created = 0, skipped = 0;
  const errors = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = get(row, ci.name);
    const email = get(row, ci.email).toLowerCase();
    if (!name || !email) { errors.push({ row: r + 1, reason: "name and email are required" }); continue; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { errors.push({ row: r + 1, reason: `invalid email: ${email}` }); continue; }
    const roleRaw = get(row, ci.role).toLowerCase();
    const role = ["admin", "instructor", "learner"].includes(roleRaw) ? roleRaw : "learner";
    const job = get(row, ci.job_title) || null;
    const ext = get(row, ci.external_id) || null;
    try {
      const ins = await pool.query(
        `INSERT INTO users (org_id, name, email, role, job_title, external_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (org_id, email) DO NOTHING RETURNING id`,
        [req.user.org_id, name, email, role, job, ext]
      );
      if (ins.rows.length) created++; else skipped++;
    } catch (e) {
      errors.push({ row: r + 1, reason: e.code === "23505" ? `duplicate external ID: ${ext}` : e.message });
    }
  }
  return res.json({ created, skipped, errors });
};

module.exports = { list, create, update, importUsers };
