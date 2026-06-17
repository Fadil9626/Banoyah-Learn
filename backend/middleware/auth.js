const { verify } = require("../lib/jwt");
const pool = require("../config/db");

// Require a valid session. The JWT is verified, then checked against the DB so
// that token_version (session revocation), is_active, and the user's current
// role/team are always authoritative — a stolen/old token stops working the
// moment token_version is bumped (password change, 2FA change, "sign out all").
async function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated" });
  let payload;
  try { payload = verify(auth.slice(7)); } catch { return res.status(401).json({ message: "Invalid or expired session" }); }
  try {
    const { rows } = await pool.query(
      "SELECT id, org_id, name, role, team, token_version, is_active FROM users WHERE id=$1", [payload.id]
    );
    const u = rows[0];
    if (!u || !u.is_active) return res.status(401).json({ message: "Account unavailable" });
    if ((payload.tv || 0) !== (u.token_version || 0)) return res.status(401).json({ message: "Session expired, please sign in again" });
    req.user = { id: u.id, org_id: u.org_id, name: u.name, role: u.role, team: u.team };
    next();
  } catch (e) { return res.status(500).json({ message: e.message }); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { protect, requireRole };
