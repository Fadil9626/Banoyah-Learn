const pool = require("../config/db");
const mailer = require("../lib/mailer");
const scheduler = require("../lib/scheduler");

const REMINDER_DEFAULTS = { reminder_enabled: "true", reminder_days: "30,7,1", reminder_interval_min: "720" };

const setSetting = (orgId, key, value) =>
  pool.query(
    "INSERT INTO org_settings (org_id, key, value) VALUES ($1,$2,$3) ON CONFLICT (org_id,key) DO UPDATE SET value=$3",
    [orgId, key, value]
  );

async function readSettings(orgId) {
  const { rows } = await pool.query("SELECT key, value FROM org_settings WHERE org_id=$1", [orgId]);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ── GET /api/settings ────────────────────────────────────────────────────────
const get = async (req, res) => {
  try {
    const s = await readSettings(req.user.org_id);
    return res.json({
      mail: {
        mail_enabled:   s.mail_enabled === "true",
        smtp_host:      s.smtp_host || "",
        smtp_port:      s.smtp_port || "587",
        smtp_secure:    s.smtp_secure === "true",
        smtp_user:      s.smtp_user || "",
        smtp_pass_set:  !!s.smtp_pass,
        mail_from:      s.mail_from || "",
        mail_from_name: s.mail_from_name || "Banoyah Learn",
      },
      reminders: {
        reminder_enabled:      (s.reminder_enabled ?? REMINDER_DEFAULTS.reminder_enabled) === "true",
        reminder_days:         s.reminder_days || REMINDER_DEFAULTS.reminder_days,
        reminder_interval_min: s.reminder_interval_min || REMINDER_DEFAULTS.reminder_interval_min,
      },
      runtime: scheduler.getState(),
    });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── PUT /api/settings/mail ───────────────────────────────────────────────────
const updateMail = async (req, res) => {
  const org = req.user.org_id;
  const map = {
    mail_enabled:   (v) => (v ? "true" : "false"),
    smtp_host:      (v) => String(v || "").trim(),
    smtp_port:      (v) => String(Math.max(1, parseInt(v, 10) || 587)),
    smtp_secure:    (v) => (v ? "true" : "false"),
    smtp_user:      (v) => String(v || "").trim(),
    mail_from:      (v) => String(v || "").trim(),
    mail_from_name: (v) => String(v || "Banoyah Learn").trim(),
  };
  try {
    for (const [k, fmt] of Object.entries(map)) if (req.body[k] !== undefined) await setSetting(org, k, fmt(req.body[k]));
    if (req.body.smtp_pass) await setSetting(org, "smtp_pass", req.body.smtp_pass); // only when provided
    return get(req, res);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── PUT /api/settings/reminders ──────────────────────────────────────────────
const updateReminders = async (req, res) => {
  const org = req.user.org_id;
  try {
    if (req.body.reminder_enabled !== undefined) await setSetting(org, "reminder_enabled", req.body.reminder_enabled ? "true" : "false");
    if (req.body.reminder_days !== undefined) {
      const days = String(req.body.reminder_days).split(",").map((n) => parseInt(n.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => b - a).join(",");
      await setSetting(org, "reminder_days", days || REMINDER_DEFAULTS.reminder_days);
    }
    if (req.body.reminder_interval_min !== undefined)
      await setSetting(org, "reminder_interval_min", String(Math.max(30, parseInt(req.body.reminder_interval_min, 10) || 720)));
    return get(req, res);
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/settings/mail/test ─────────────────────────────────────────────
const testMail = async (req, res) => {
  const to = req.body.to;
  if (!to) return res.status(400).json({ message: "Recipient address required" });
  try {
    const cfg = await mailer.loadMailConfig(req.user.org_id);
    cfg.enabled = true; // allow testing before enabling
    if (req.body.smtp_pass) cfg.pass = req.body.smtp_pass;
    if (!mailer.isConfigured(cfg))
      return res.status(400).json({ message: "SMTP is not fully configured (host, user, password and from address required)." });
    const { rows } = await pool.query("SELECT name FROM organizations WHERE id=$1", [req.user.org_id]);
    const org = rows[0]?.name || "Banoyah Learn";
    const result = await mailer.sendMail({
      to, subject: `${org} — SMTP test`,
      html: `<p>This is a test email from <strong>${org}</strong> (Banoyah Learn). If you received it, re-certification reminders will be delivered.</p>`,
      text: `Test email from ${org} (Banoyah Learn). Outbound email is working.`,
    }, cfg);
    if (!result.ok) return res.status(502).json({ message: result.error || "Send failed" });
    return res.json({ ok: true, to });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/settings/reminders/run ─────────────────────────────────────────
const runReminders = async (req, res) => {
  try {
    return res.json(await scheduler.runReminderCycle("manual"));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { get, updateMail, updateReminders, testMail, runReminders };
