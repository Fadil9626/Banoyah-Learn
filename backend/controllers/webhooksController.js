const pool = require("../config/db");
const wh = require("../lib/webhooks");
const audit = require("../lib/audit");

const publicEp = (e) => ({
  id: e.id, url: e.url, events: e.events, is_active: e.is_active,
  last_status: e.last_status, last_event: e.last_event, last_delivered_at: e.last_delivered_at,
  secret_prefix: e.secret ? e.secret.slice(0, 12) : null, created_at: e.created_at,
});

// ── GET /api/webhooks ────────────────────────────────────────────────────────
const list = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM webhook_endpoints WHERE org_id=$1 ORDER BY created_at DESC", [req.user.org_id]);
    return res.json({ endpoints: rows.map(publicEp), available_events: wh.EVENTS });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/webhooks ───────────────────────────────────────────────────────
// Body: { url, events:[] }. Returns the signing secret ONCE.
const create = async (req, res) => {
  const { url, events } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ message: "A valid http(s) URL is required" });
  const evs = Array.isArray(events) ? events.filter((e) => wh.EVENTS.includes(e)) : [];
  if (!evs.length) return res.status(400).json({ message: "Select at least one event" });
  try {
    const secret = wh.newSecret();
    const { rows } = await pool.query(
      `INSERT INTO webhook_endpoints (org_id, url, secret, events, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.org_id, url, secret, JSON.stringify(evs), req.user.id]
    );
    audit.record(req, "webhook.create", { target: url });
    return res.status(201).json({ ...publicEp(rows[0]), secret }); // full secret shown once
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── DELETE /api/webhooks/:id ─────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const { rows } = await pool.query("DELETE FROM webhook_endpoints WHERE id=$1 AND org_id=$2 RETURNING url", [req.params.id, req.user.org_id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    audit.record(req, "webhook.delete", { target: rows[0].url });
    return res.json({ message: "Deleted" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/webhooks/:id/test ──────────────────────────────────────────────
// Send a signed test ping and report the response status.
const test = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM webhook_endpoints WHERE id=$1 AND org_id=$2", [req.params.id, req.user.org_id]);
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    const status = await wh.deliver(rows[0], "ping", { message: "Test event from Banoyah Learn" });
    return res.json({ status, ok: status >= 200 && status < 300 });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { list, create, remove, test };
