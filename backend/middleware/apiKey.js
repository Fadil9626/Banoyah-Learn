const pool = require("../config/db");
const { sha256 } = require("../lib/apiKeys");

// Authenticate a consumer system via the X-API-Key header. Sets req.consumer
// (with org_id + scopes). Distinct from the admin/learner JWT auth — this is the
// machine-to-machine surface other products call.
async function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key) return res.status(401).json({ error: "Missing X-API-Key header" });
  try {
    const { rows } = await pool.query(
      "SELECT * FROM api_consumers WHERE key_hash=$1 AND is_active=true", [sha256(key)]
    );
    if (!rows.length) return res.status(401).json({ error: "Invalid or revoked API key" });
    req.consumer = rows[0];
    // Best-effort, fire-and-forget last-used stamp.
    pool.query("UPDATE api_consumers SET last_used_at=NOW() WHERE id=$1", [rows[0].id]).catch(() => {});
    next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// Require a scope on the consumer's key.
function requireScope(scope) {
  return (req, res, next) => {
    const scopes = Array.isArray(req.consumer?.scopes) ? req.consumer.scopes : [];
    if (!scopes.includes(scope)) return res.status(403).json({ error: `Key missing scope: ${scope}` });
    next();
  };
}

module.exports = { apiKeyAuth, requireScope };
