const pool = require("../config/db");

const isExpired = (until) => !!until && new Date(until) < new Date();

// ── GET /api/verify/:serial ──────────────────────────────────────────────────
// Public (no auth). Confirms a certificate by its serial. Returns only what's
// already printed on the certificate — learner name, course, org, dates — so a
// third party can check authenticity. No email or other PII is exposed.
const verify = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cert.serial, cert.score, cert.issued_at, cert.certified_until,
              u.name AS learner, c.title AS course, o.id AS org_id, o.name AS org
       FROM certificates cert
       JOIN users u ON u.id=cert.user_id
       JOIN courses c ON c.id=cert.course_id
       JOIN organizations o ON o.id=cert.org_id
       WHERE cert.serial=$1`,
      [req.params.serial]
    );
    if (!rows.length) return res.status(404).json({ found: false, valid: false });
    const r = rows[0];
    const b = (await pool.query(
      "SELECT key, value FROM org_settings WHERE org_id=$1 AND key IN ('brand_accent','brand_logo')", [r.org_id]
    )).rows;
    const brand = Object.fromEntries(b.map((x) => [x.key, x.value]));
    return res.json({
      found: true,
      valid: !isExpired(r.certified_until),
      expired: isExpired(r.certified_until),
      serial: r.serial, learner: r.learner, course: r.course, org: r.org, score: r.score,
      issued_at: r.issued_at, certified_until: r.certified_until,
      brand_accent: brand.brand_accent || "#4F46E5", brand_logo: brand.brand_logo || "",
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { verify };
