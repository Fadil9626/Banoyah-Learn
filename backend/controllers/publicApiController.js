const crypto = require("crypto");
const pool = require("../config/db");

const isExpired = (until) => !!until && new Date(until) < new Date();
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

const shapeCert = (r) => ({
  course_id: r.course_id,
  course: r.course_title,
  category: r.category || null,
  serial: r.serial,
  score: r.score,
  issued_at: r.issued_at,
  certified_until: r.certified_until,
  expired: isExpired(r.certified_until),
});

// ── GET /api/v1/certifications ───────────────────────────────────────────────
// Look up a person's certifications within the consumer's organization.
// Query: external_id=... (preferred) or email=... ; optional course_id=...
// Returns { certified, certifications: [...] } so a consuming system can gate or
// just display. `certified` = has at least one non-expired certificate (scoped
// to course_id when provided).
const certifications = async (req, res) => {
  const orgId = req.consumer.org_id;
  const { external_id, email, course_id } = req.query;
  if (!external_id && !email) return res.status(400).json({ error: "Provide external_id or email" });
  try {
    const { rows: users } = await pool.query(
      `SELECT id, name, email, external_id, job_title FROM users
       WHERE org_id=$1 AND (${external_id ? "external_id=$2" : "LOWER(email)=LOWER($2)"}) LIMIT 1`,
      [orgId, external_id || email]
    );
    if (!users.length) return res.status(404).json({ error: "No matching person in this organization" });
    const user = users[0];

    const params = [user.id];
    let filter = "";
    if (course_id) { params.push(Number(course_id)); filter = " AND cert.course_id=$2"; }
    const { rows } = await pool.query(
      `SELECT cert.course_id, cert.serial, cert.score, cert.issued_at, cert.certified_until,
              c.title AS course_title, c.category
       FROM certificates cert JOIN courses c ON c.id=cert.course_id
       WHERE cert.user_id=$1${filter}
       ORDER BY cert.issued_at DESC`,
      params
    );
    const certs = rows.map(shapeCert);
    return res.json({
      external_id: user.external_id,
      person: { name: user.name, email: user.email, job_title: user.job_title || null },
      certified: certs.some((c) => !c.expired),
      certifications: certs,
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

// ── GET /api/v1/certifications/:serial ───────────────────────────────────────
// Verify a single certificate by its serial (within the consumer's org).
const verify = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cert.*, c.title AS course_title, c.category, u.name AS learner_name, u.external_id
       FROM certificates cert
       JOIN courses c ON c.id=cert.course_id
       JOIN users u ON u.id=cert.user_id
       WHERE cert.serial=$1 AND cert.org_id=$2`,
      [req.params.serial, req.consumer.org_id]
    );
    if (!rows.length) return res.status(404).json({ valid: false, error: "Certificate not found" });
    const r = rows[0];
    return res.json({
      valid: !isExpired(r.certified_until),
      expired: isExpired(r.certified_until),
      serial: r.serial,
      learner: r.learner_name,
      external_id: r.external_id,
      course: r.course_title,
      score: r.score,
      issued_at: r.issued_at,
      certified_until: r.certified_until,
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

// ── GET /api/v1/courses ──────────────────────────────────────────────────────
// The published course catalog (so a consumer can list what's certifiable).
const courses = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, category, pass_mark, validity_months
       FROM courses WHERE org_id=$1 AND status='published' ORDER BY title`,
      [req.consumer.org_id]
    );
    return res.json({ courses: rows });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

// ── POST /api/v1/login-link ──────────────────────────────────────────────────
// A trusted consumer (with a valid API key) requests a one-time login link for a
// staff member, identified by email. The learner is auto-provisioned in the
// consumer's org if they don't exist yet. The returned URL logs them straight in.
// Body: { email, name? }. Token is single-use and valid for 2 minutes.
const loginLink = async (req, res) => {
  const orgId = req.consumer.org_id;
  const email = (req.body.email || "").toLowerCase().trim();
  const name = (req.body.name || "").trim();
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    let user = (await pool.query("SELECT * FROM users WHERE org_id=$1 AND email=$2", [orgId, email])).rows[0];
    if (!user) {
      user = (await pool.query(
        "INSERT INTO users (org_id, name, email, role) VALUES ($1,$2,$3,'learner') RETURNING *",
        [orgId, name || email.split("@")[0], email]
      )).rows[0];
    } else if (name && !user.name) {
      await pool.query("UPDATE users SET name=$1 WHERE id=$2", [name, user.id]);
    }
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      "UPDATE users SET login_token_hash=$1, login_expires_at=NOW()+INTERVAL '2 minutes' WHERE id=$2",
      [sha256(token), user.id]
    );
    const base = `${req.protocol}://${req.get("host")}`;
    return res.json({ url: `${base}/sso/${token}`, provisioned: !user.password_hash });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

module.exports = { certifications, verify, courses, loginLink };
