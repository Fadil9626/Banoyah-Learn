const { verify } = require("../lib/jwt");

// Require a valid admin/learner JWT. Populates req.user = { id, org_id, role, name }.
function protect(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated" });
  try {
    req.user = verify(auth.slice(7));
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

// Restrict to specific roles (admin/instructor/learner).
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { protect, requireRole };
