const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sign } = require("../lib/jwt");

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "org";

const publicUser = (u) => ({
  id: u.id, org_id: u.org_id, name: u.name, email: u.email,
  role: u.role, job_title: u.job_title, external_id: u.external_id,
});

// ── POST /api/auth/bootstrap ───────────────────────────────────────────────
// One-time setup: creates the first organization + its admin. Disabled once any
// user exists (the very first run only).
const bootstrap = async (req, res) => {
  const { org_name, name, email, password } = req.body;
  if (!org_name || !name || !email || !password)
    return res.status(400).json({ message: "org_name, name, email and password are required" });
  if (String(password).length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  try {
    const { rows: existing } = await pool.query("SELECT 1 FROM users LIMIT 1");
    if (existing.length) return res.status(409).json({ message: "Already initialised" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let slug = slugify(org_name);
      const dupe = await client.query("SELECT 1 FROM organizations WHERE slug=$1", [slug]);
      if (dupe.rows.length) slug = `${slug}-${Date.now().toString(36)}`;
      const org = (await client.query(
        "INSERT INTO organizations (name, slug) VALUES ($1,$2) RETURNING *", [org_name, slug]
      )).rows[0];
      const hash = await bcrypt.hash(password, 12);
      const user = (await client.query(
        `INSERT INTO users (org_id, name, email, password_hash, role)
         VALUES ($1,$2,$3,$4,'admin') RETURNING *`,
        [org.id, name, email.toLowerCase().trim(), hash]
      )).rows[0];
      await client.query("COMMIT");
      const token = sign({ id: user.id, org_id: user.org_id, role: user.role, name: user.name });
      return res.status(201).json({ token, user: publicUser(user), organization: org });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/auth/status ───────────────────────────────────────────────────
// Lets the frontend show the bootstrap screen vs the login screen.
const status = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 FROM users LIMIT 1");
    return res.json({ initialised: rows.length > 0 });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND is_active=true AND password_hash IS NOT NULL ORDER BY id ASC LIMIT 1",
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = sign({ id: user.id, org_id: user.org_id, role: user.role, name: user.name });
    return res.json({ token, user: publicUser(user) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.*, o.name AS org_name, o.slug AS org_slug
       FROM users u JOIN organizations o ON o.id = u.org_id WHERE u.id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    return res.json({ user: publicUser(u), organization: { id: u.org_id, name: u.org_name, slug: u.org_slug } });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { bootstrap, status, login, me };
