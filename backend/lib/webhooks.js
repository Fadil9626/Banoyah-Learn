// Outbound webhooks. emit() fans an event out to every active endpoint subscribed
// to it; deliver() POSTs a signed payload (best-effort, fire-and-forget, with a
// timeout) and records the last response status. Receivers verify the
// X-Learn-Signature header = HMAC-SHA256(body, endpoint secret).
const crypto = require("crypto");
const pool = require("../config/db");

const EVENTS = ["certification.completed", "certification.expired", "assignment.overdue"];

const sign = (secret, body) => crypto.createHmac("sha256", secret).update(body).digest("hex");
const newSecret = () => "whsec_" + crypto.randomBytes(24).toString("hex");

async function deliver(ep, event, data) {
  const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  let status = 0;
  try {
    const r = await fetch(ep.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Learn-Event": event,
        "X-Learn-Signature": sign(ep.secret, body),
      },
      body,
      signal: ctrl.signal,
    });
    status = r.status;
  } catch {
    status = 0; // network error / timeout
  } finally {
    clearTimeout(t);
  }
  pool.query(
    "UPDATE webhook_endpoints SET last_status=$1, last_event=$2, last_delivered_at=NOW() WHERE id=$3",
    [status, event, ep.id]
  ).catch(() => {});
  return status;
}

// Fire an event to all subscribed endpoints for an org (non-blocking).
async function emit(orgId, event, data) {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM webhook_endpoints WHERE org_id=$1 AND is_active=true", [orgId]
    );
    for (const ep of rows) {
      if (Array.isArray(ep.events) && ep.events.includes(event)) deliver(ep, event, data);
    }
  } catch { /* never block the triggering action */ }
}

module.exports = { EVENTS, emit, deliver, sign, newSecret };
