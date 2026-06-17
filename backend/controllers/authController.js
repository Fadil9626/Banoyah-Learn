const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { sign } = require("../lib/jwt");
const audit = require("../lib/audit");
const totp = require("../lib/totp");
const guard = require("../lib/loginGuard");
const mailer = require("../lib/mailer");

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "org";
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const clientIp = (req) => (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim();

const publicUser = (u) => ({
  id: u.id, org_id: u.org_id, name: u.name, email: u.email, role: u.role,
  job_title: u.job_title, external_id: u.external_id, team: u.team || null,
  totp_enabled: !!u.totp_enabled,
});

// Issue a session token that carries the user's current token_version.
const tokenFor = (u) => sign({ id: u.id, org_id: u.org_id, role: u.role, name: u.name, tv: u.token_version || 0 });

// ── POST /api/auth/bootstrap ───────────────────────────────────────────────
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
      if ((await client.query("SELECT 1 FROM organizations WHERE slug=$1", [slug])).rows.length) slug = `${slug}-${Date.now().toString(36)}`;
      const org = (await client.query("INSERT INTO organizations (name, slug) VALUES ($1,$2) RETURNING *", [org_name, slug])).rows[0];
      const hash = await bcrypt.hash(password, 12);
      const user = (await client.query(
        `INSERT INTO users (org_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,'admin') RETURNING *`,
        [org.id, name, email.toLowerCase().trim(), hash]
      )).rows[0];
      await client.query("COMMIT");
      return res.status(201).json({ token: tokenFor(user), user: publicUser(user), organization: org });
    } catch (e) { await client.query("ROLLBACK"); throw e; } finally { client.release(); }
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const status = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT 1 FROM users LIMIT 1");
    return res.json({ initialised: rows.length > 0 });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password, totp_code } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  const ip = clientIp(req);

  const locked = guard.check(email, ip);
  if (locked.locked) return res.status(429).json({ message: `Too many attempts. Try again in ${Math.ceil(locked.retryAfter / 60)} minute(s).` });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email=$1 AND is_active=true AND password_hash IS NOT NULL ORDER BY id ASC LIMIT 1",
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      guard.fail(email, ip);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Password is correct. If 2FA is on, require a valid (non-replayed) code.
    if (user.totp_enabled) {
      if (!totp_code) return res.json({ mfa_required: true });
      const matched = totp.verify(user.totp_secret, totp_code);
      if (matched === null) { guard.fail(email, ip); return res.status(401).json({ mfa_required: true, message: "Invalid authentication code" }); }
      if (user.totp_last_step != null && matched <= Number(user.totp_last_step))
        return res.status(401).json({ mfa_required: true, message: "Code already used — wait for the next one" });
      await pool.query("UPDATE users SET totp_last_step=$1 WHERE id=$2", [matched, user.id]);
    }

    guard.reset(email, ip);
    audit.record(req, "user.login", { actor: user });
    return res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.*, o.name AS org_name, o.slug AS org_slug FROM users u JOIN organizations o ON o.id=u.org_id WHERE u.id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    return res.json({ user: publicUser(u), organization: { id: u.org_id, name: u.org_name, slug: u.org_slug } });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

const updateProfile = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
  try {
    await pool.query("UPDATE users SET name=$1, updated_at=NOW() WHERE id=$2", [name.trim(), req.user.id]);
    return res.json({ message: "Profile updated", name: name.trim() });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── PUT /api/auth/password ─────────────────────────────────────────────────
// Bumps token_version (signs out other sessions) and returns a fresh token.
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || String(new_password).length < 8)
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  try {
    const u = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
    if (u?.password_hash && !(await bcrypt.compare(current_password || "", u.password_hash)))
      return res.status(401).json({ message: "Current password is incorrect" });
    const hash = await bcrypt.hash(new_password, 12);
    const updated = (await pool.query(
      "UPDATE users SET password_hash=$1, token_version=token_version+1, updated_at=NOW() WHERE id=$2 RETURNING *", [hash, req.user.id]
    )).rows[0];
    audit.record(req, "user.password_change");
    return res.json({ message: "Password updated", token: tokenFor(updated) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/auth/forgot ──────────────────────────────────────────────────
// Public. Always returns 200 (no account enumeration). Emails a reset link.
const forgot = async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  try {
    if (email) {
      const u = (await pool.query(
        "SELECT * FROM users WHERE email=$1 AND is_active=true LIMIT 1", [email]
      )).rows[0];
      if (u) {
        const token = crypto.randomBytes(32).toString("hex");
        await pool.query(
          "UPDATE users SET reset_token_hash=$1, reset_expires_at=NOW()+INTERVAL '1 hour' WHERE id=$2",
          [sha256(token), u.id]
        );
        const base = `${req.protocol}://${req.get("host")}`;
        const link = `${base}/reset/${token}`;
        const cfg = await mailer.loadMailConfig(u.org_id);
        const orgName = (await pool.query("SELECT name FROM organizations WHERE id=$1", [u.org_id])).rows[0]?.name;
        const tpl = mailer.resetEmail({ name: u.name, link, brand: { org: orgName } });
        mailer.sendMail({ to: u.email, ...tpl }, cfg); // best-effort
        audit.record(req, "user.password_reset_requested", { actor: u });
      }
    }
    return res.json({ message: "If that email is registered, a reset link has been sent." });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/auth/reset ───────────────────────────────────────────────────
// Public. Consumes a valid, unexpired reset token; bumps token_version.
const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password || String(new_password).length < 8)
    return res.status(400).json({ message: "Token and a password of at least 8 characters are required" });
  try {
    const u = (await pool.query(
      "SELECT * FROM users WHERE reset_token_hash=$1 AND reset_expires_at > NOW() LIMIT 1", [sha256(token)]
    )).rows[0];
    if (!u) return res.status(400).json({ message: "This reset link is invalid or has expired" });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query(
      "UPDATE users SET password_hash=$1, reset_token_hash=NULL, reset_expires_at=NULL, token_version=token_version+1, updated_at=NOW() WHERE id=$2",
      [hash, u.id]
    );
    audit.record(req, "user.password_reset", { actor: u });
    return res.json({ message: "Password reset. You can now sign in." });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── 2FA ────────────────────────────────────────────────────────────────────
// POST /api/auth/2fa/start — generate a secret + provisioning URI (not yet enabled).
const start2fa = async (req, res) => {
  try {
    const u = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
    if (u.totp_enabled) return res.status(409).json({ message: "Two-factor is already enabled" });
    const secret = totp.generateSecret();
    await pool.query("UPDATE users SET totp_secret=$1, totp_enabled=false WHERE id=$2", [secret, u.id]);
    return res.json({ secret, otpauth_url: totp.keyUri(secret, u.email) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// POST /api/auth/2fa/enable — verify a code against the pending secret, then enable.
const enable2fa = async (req, res) => {
  const { code } = req.body;
  try {
    const u = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
    if (!u.totp_secret) return res.status(400).json({ message: "Start 2FA setup first" });
    const matched = totp.verify(u.totp_secret, code);
    if (matched === null) return res.status(400).json({ message: "Incorrect code — check your authenticator and try again" });
    const updated = (await pool.query(
      "UPDATE users SET totp_enabled=true, totp_last_step=$1, token_version=token_version+1 WHERE id=$2 RETURNING *", [matched, u.id]
    )).rows[0];
    audit.record(req, "user.2fa_enabled");
    return res.json({ message: "Two-factor enabled", token: tokenFor(updated) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// POST /api/auth/2fa/disable — requires the current password.
const disable2fa = async (req, res) => {
  const { password } = req.body;
  try {
    const u = (await pool.query("SELECT * FROM users WHERE id=$1", [req.user.id])).rows[0];
    if (u.password_hash && !(await bcrypt.compare(password || "", u.password_hash)))
      return res.status(401).json({ message: "Password is incorrect" });
    const updated = (await pool.query(
      "UPDATE users SET totp_enabled=false, totp_secret=NULL, totp_last_step=NULL, token_version=token_version+1 WHERE id=$1 RETURNING *", [u.id]
    )).rows[0];
    audit.record(req, "user.2fa_disabled");
    return res.json({ message: "Two-factor disabled", token: tokenFor(updated) });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { bootstrap, status, login, me, updateProfile, changePassword, forgot, resetPassword, start2fa, enable2fa, disable2fa };
