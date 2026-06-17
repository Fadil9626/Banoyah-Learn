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
const webhooks = require("./webhooks");

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
  const summary = { trigger, at: new Date().toISOString(), scanned: 0, reminders: 0, expired: 0, assignment_reminders: 0, assignment_overdue: 0, emailed: 0, errors: 0 };

  const orgs = (await pool.query("SELECT id FROM organizations")).rows;
  const now = Date.now();

  for (const { id: orgId } of orgs) {
    const cfg = await orgConfig(orgId);
    if (!cfg.enabled) continue;
    const mailCfg = await mailer.loadMailConfig(orgId);
    if (!mailCfg.enabled) continue;
    const brand = await brandFor(orgId);

    const certs = (await pool.query(
      `SELECT cert.id, cert.certified_until, cert.last_reminder_day, cert.serial, cert.course_id,
              c.title AS course, u.name AS learner_name, u.email AS learner_email, u.external_id
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
          webhooks.emit(orgId, "certification.expired", {
            external_id: cert.external_id || null, learner: cert.learner_name,
            course: cert.course, course_id: cert.course_id, serial: cert.serial,
          });
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

    // ── Assignment due-date reminders ────────────────────────────────────────
    // Assigned + published + not yet completed (no valid certificate).
    const assigns = (await pool.query(
      `SELECT a.id, a.due_date, a.last_reminder_day, a.course_id,
              c.title AS course, u.name AS learner_name, u.email AS learner_email, u.external_id
       FROM assignments a
       JOIN courses c ON c.id=a.course_id AND c.status='published'
       JOIN users u ON u.id=a.user_id
       LEFT JOIN certificates cert ON cert.user_id=a.user_id AND cert.course_id=a.course_id
              AND (cert.certified_until IS NULL OR cert.certified_until > NOW())
       WHERE a.org_id=$1 AND a.due_date IS NOT NULL AND u.email IS NOT NULL AND cert.id IS NULL`,
      [orgId]
    )).rows;

    for (const a of assigns) {
      summary.scanned++;
      const due = new Date(a.due_date).getTime();
      if (!Number.isFinite(due)) continue;
      const daysLeft = Math.ceil((due - now) / DAY);
      const last = a.last_reminder_day;
      try {
        // Past the due date → one-off overdue notice (sentinel 0).
        if (daysLeft < 0) {
          if (last === 0) continue;
          const tpl = mailer.assignmentOverdueEmail({ name: a.learner_name, course: a.course, dueDate: a.due_date, brand });
          const r = await mailer.sendMail({ to: a.learner_email, ...tpl }, mailCfg);
          await pool.query("UPDATE assignments SET last_reminder_day=0 WHERE id=$1", [a.id]);
          webhooks.emit(orgId, "assignment.overdue", {
            external_id: a.external_id || null, learner: a.learner_name,
            course: a.course, course_id: a.course_id, due_date: a.due_date,
          });
          summary.assignment_overdue++; if (r.ok) summary.emailed++; else summary.errors += r.error ? 1 : 0;
          continue;
        }
        // Approaching the due date → most-urgent threshold crossed, once each.
        const applicable = cfg.days.filter((t) => daysLeft <= t).sort((x, y) => x - y)[0];
        if (applicable != null && (last == null || applicable < last)) {
          const tpl = mailer.assignmentDueEmail({ name: a.learner_name, course: a.course, daysLeft, dueDate: a.due_date, brand });
          const r = await mailer.sendMail({ to: a.learner_email, ...tpl }, mailCfg);
          await pool.query("UPDATE assignments SET last_reminder_day=$1 WHERE id=$2", [applicable, a.id]);
          summary.assignment_reminders++; if (r.ok) summary.emailed++; else summary.errors += r.error ? 1 : 0;
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
    if (s.reminders || s.expired || s.assignment_reminders || s.assignment_overdue || s.errors)
      console.log(`[reminders] cert=${s.reminders} expired=${s.expired} assign=${s.assignment_reminders} overdue=${s.assignment_overdue} emailed=${s.emailed} errors=${s.errors}`);
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
