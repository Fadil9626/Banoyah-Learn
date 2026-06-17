// ─────────────────────────────────────────────────────────────────────────────
// Banoyah Learn mailer — per-organization outbound SMTP (nodemailer).
// Config lives in org_settings (mail_*), editable from Settings. Outbound only,
// so it works from a local machine (dials out to e.g. Gmail:587). Every send is
// best-effort: a failure is a soft miss, never throws.
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require("nodemailer");
const pool = require("../config/db");

const MAIL_KEYS = [
  "mail_enabled", "smtp_host", "smtp_port", "smtp_secure",
  "smtp_user", "smtp_pass", "mail_from", "mail_from_name",
];

async function loadMailConfig(orgId) {
  try {
    const { rows } = await pool.query(
      "SELECT key, value FROM org_settings WHERE org_id=$1 AND key = ANY($2)", [orgId, MAIL_KEYS]
    );
    const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      enabled:  m.mail_enabled === "true",
      host:     m.smtp_host || "",
      port:     parseInt(m.smtp_port, 10) || 587,
      secure:   m.smtp_secure === "true",
      user:     m.smtp_user || "",
      pass:     m.smtp_pass || "",
      from:     m.mail_from || m.smtp_user || "",
      fromName: m.mail_from_name || "Banoyah Learn",
    };
  } catch {
    return { enabled: false };
  }
}

const isConfigured = (c) => !!(c && c.host && c.user && c.pass && c.from);

async function sendMail({ to, subject, html, text }, cfg) {
  if (!cfg?.enabled) return { ok: false, skipped: "disabled" };
  if (!isConfigured(cfg)) return { ok: false, skipped: "not_configured" };
  if (!to) return { ok: false, skipped: "no_recipient" };
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transport.sendMail({ from: `"${cfg.fromName}" <${cfg.from}>`, to, subject, text: text || undefined, html });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Templates ───────────────────────────────────────────────────────────────
function shell(title, body, brand) {
  const accent = brand?.accent || "#4F46E5";
  const org = brand?.org || "Banoyah Learn";
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:${accent};height:6px"></div>
      <div style="padding:28px 28px 8px"><h1 style="margin:0;font-size:18px">${title}</h1></div>
      <div style="padding:0 28px 24px;font-size:14px;line-height:1.6;color:#334155">${body}</div>
      <div style="padding:16px 28px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8">${org} · training & certification</div>
    </div>
  </div></body></html>`;
}

function reminderEmail({ name, course, daysLeft, certifiedUntil, brand }) {
  const when = daysLeft <= 0 ? "today" : `in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  const dateStr = certifiedUntil ? new Date(certifiedUntil).toLocaleDateString(undefined, { dateStyle: "long" }) : "";
  return {
    subject: `Your "${course}" certification expires ${when}`,
    html: shell("Time to re-certify", `
      <p>Hi ${name || "there"},</p>
      <p>Your certification for <strong>${course}</strong> expires <strong>${when}</strong>${dateStr ? ` (${dateStr})` : ""}.</p>
      <p>To stay certified, please log in to ${brand?.org || "Banoyah Learn"} and re-take the course before it lapses.</p>
      <p style="margin-top:18px">Thank you,<br>${brand?.org || "Banoyah Learn"}</p>`, brand),
    text: `Hi ${name || "there"},\n\nYour certification for ${course} expires ${when}${dateStr ? ` (${dateStr})` : ""}. Please re-take the course to stay certified.\n\n${brand?.org || "Banoyah Learn"}`,
  };
}

function expiredEmail({ name, course, brand }) {
  return {
    subject: `Your "${course}" certification has expired`,
    html: shell("Certification expired", `
      <p>Hi ${name || "there"},</p>
      <p>Your certification for <strong>${course}</strong> has now expired.</p>
      <p>Please log in to ${brand?.org || "Banoyah Learn"} and re-take the course to renew it.</p>
      <p style="margin-top:18px">${brand?.org || "Banoyah Learn"}</p>`, brand),
    text: `Hi ${name || "there"},\n\nYour certification for ${course} has expired. Please re-take the course to renew it.\n\n${brand?.org || "Banoyah Learn"}`,
  };
}

module.exports = { MAIL_KEYS, loadMailConfig, isConfigured, sendMail, reminderEmail, expiredEmail };
