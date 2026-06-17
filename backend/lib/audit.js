// Audit logging. record() captures who (actor) did what (action) to what (target),
// best-effort — it must never throw or block the request it's logging. Actor comes
// from req.user by default; pass opts.actor for pre-auth events (e.g. login).
const pool = require("../config/db");

async function record(req, action, opts = {}) {
  try {
    const a = opts.actor || req.user || {};
    const ip = (req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "").toString().split(",")[0].trim().slice(0, 64);
    await pool.query(
      `INSERT INTO audit_log (org_id, actor_id, actor_name, action, target, details, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [a.org_id || null, a.id || null, a.name || null, action,
       opts.target ? String(opts.target).slice(0, 255) : null,
       opts.details ? JSON.stringify(opts.details) : null, ip]
    );
  } catch (e) {
    // Swallow — auditing failure should never affect the user action.
  }
}

module.exports = { record };
