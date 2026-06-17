// ─────────────────────────────────────────────────────────────────────────────
// Re-certification reminder scheduler.
//
// A self-running loop that periodically scans certificates with an expiry and,
// per organization, emails the learner as the expiry approaches — at configurable
// day thresholds (e.g. 30/7/1), once per threshold (last_reminder_day dedup), plus
// a one-off notice when it lapses. Reusing the Control Center pattern: best-effort
// email, idempotent state, config read live. Re-certifying resets the ladder
// (learnController clears last_reminder_day on cert re-issue).
// ─────────────────────────────────────────────────────────────────────────────
const pool = require("../config/db");
const mailer = require("./mailer");

const DAY = 86_400_000;
const DEFAULTS = { enabled: true, days: [30, 7, 1], interval_min: 720 };

let timer = null;
let running = false;
const state = { last_run: null, next_run: null, last_summary: null };

async function orgConfig(orgId) {
  const { rows } = await pool.query(
    "SELECT key, value FROM org_settings WHERE org_id=$1 AND key LIKE 'reminder_%'", [orgId]
  );
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const days = (m.reminder_days || "").split(",").map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => b - a);
  return {
    enabled: m.reminder_enabled ? m.reminder_enabled === "true" : DEFAULTS.enabled,
    days: days.length ? days : DEFAULTS.days,
    interval_min: m.reminder_interval_min ? Math.max(30, parseInt(m.reminder_interval_min, 10)) : DEFAULTS.interval_min,
  };
}

async function brandFor(orgId) {
  const { rows } = await pool.query("SELECT name FROM organizations WHERE id=$1", [orgId]);
  return { org: rows[0]?.name || "Banoyah Learn", accent: "#4F46E5" };
}

async function runReminderCycle(trigger = "scheduled") {
  const summary = { trigger, at: new Date().toISOString(), scanned: 0, reminders: 0, expired: 0, emailed: 0, errors: 0 };

  const orgs = (await pool.query("SELECT id FROM organizations")).rows;
  const now = Date.now();

  for (const { id: orgId } of orgs) {
    const cfg = await orgConfig(orgId);
    if (!cfg.enabled) continue;
    const mailCfg = await mailer.loadMailConfig(orgId);
    if (!mailCfg.enabled) continue;
    const brand = await brandFor(orgId);

    const certs = (await pool.query(
      `SELECT cert.id, cert.certified_until, cert.last_reminder_day,
              c.title AS course, u.name AS learner_name, u.email AS learner_email
       FROM certificates cert
       JOIN courses c ON c.id=cert.course_id
       JOIN users u ON u.id=cert.user_id
       WHERE cert.org_id=$1 AND cert.certified_until IS NOT NULL AND u.email IS NOT NULL`,
      [orgId]
    )).rows;

    for (const cert of certs) {
      summary.scanned++;
      const exp = new Date(cert.certified_until).getTime();
      if (!Number.isFinite(exp)) continue;
      const daysLeft = Math.ceil((exp - now) / DAY);
      const last = cert.last_reminder_day;

      try {
        // Lapsed → one-off expired notice (sentinel last_reminder_day = 0).
        if (daysLeft <= 0) {
          if (last === 0) continue;
          const tpl = mailer.expiredEmail({ name: cert.learner_name, course: cert.course, brand });
          const r = await mailer.sendMail({ to: cert.learner_email, ...tpl }, mailCfg);
          await pool.query("UPDATE certificates SET last_reminder_day=0 WHERE id=$1", [cert.id]);
          summary.expired++; if (r.ok) summary.emailed++; else summary.errors += r.error ? 1 : 0;
          continue;
        }
        // Approaching → most-urgent threshold crossed, once each.
        const applicable = cfg.days.filter((t) => daysLeft <= t).sort((a, b) => a - b)[0];
        if (applicable != null && (last == null || applicable < last)) {
          const tpl = mailer.reminderEmail({ name: cert.learner_name, course: cert.course, daysLeft, certifiedUntil: cert.certified_until, brand });
          const r = await mailer.sendMail({ to: cert.learner_email, ...tpl }, mailCfg);
          await pool.query("UPDATE certificates SET last_reminder_day=$1 WHERE id=$2", [applicable, cert.id]);
          summary.reminders++; if (r.ok) summary.emailed++; else summary.errors += r.error ? 1 : 0;
        }
      } catch (e) {
        summary.errors++;
      }
    }
  }

  state.last_run = summary.at;
  state.last_summary = summary;
  return summary;
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const s = await runReminderCycle("scheduled");
    if (s.reminders || s.expired || s.errors)
      console.log(`[reminders] reminders=${s.reminders} expired=${s.expired} emailed=${s.emailed} errors=${s.errors}`);
  } catch (e) {
    console.error("[reminders] cycle error:", e.message);
  } finally {
    running = false;
    schedule();
  }
}

function schedule(mins = DEFAULTS.interval_min) {
  if (timer) clearTimeout(timer);
  const ms = Math.max(30, mins) * 60_000;
  state.next_run = new Date(Date.now() + ms).toISOString();
  timer = setTimeout(tick, ms);
  timer.unref?.();
}

function start() {
  setTimeout(tick, 15_000).unref?.();
  console.log("[reminders] re-certification scheduler started");
}

const getState = () => ({ ...state });

module.exports = { start, runReminderCycle, getState };
