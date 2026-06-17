// Tamper-evident audit logging. Each entry's hash = SHA-256(prev_hash + payload),
// chaining every row to the one before it for its org. Altering or deleting any
// past entry breaks the chain, which verifyChain() detects. record() is
// best-effort — it must never throw or block the action it logs.
const crypto = require("crypto");
const pool = require("../config/db");

// Canonical, deterministic representation of a row's logged fields (excludes id).
function payloadOf({ org_id, actor_id, actor_name, action, target, details, created_at }) {
  return JSON.stringify({
    org_id: org_id ?? null, actor_id: actor_id ?? null, actor_name: actor_name ?? null,
    action, target: target ?? null, details: details ?? null, created_at,
  });
}
const hashOf = (prev, payload) => crypto.createHash("sha256").update((prev || "") + payload).digest("hex");

async function record(req, action, opts = {}) {
  const client = await pool.connect();
  try {
    const a = opts.actor || req?.user || {};
    const ip = (req?.headers?.["x-forwarded-for"] || req?.ip || req?.socket?.remoteAddress || "")
      .toString().split(",")[0].trim().slice(0, 64);
    const created_at = new Date().toISOString();
    const row = {
      org_id: a.org_id || null, actor_id: a.id || null, actor_name: a.name || null,
      action, target: opts.target ? String(opts.target).slice(0, 255) : null,
      details: opts.details || null, created_at,
    };
    await client.query("BEGIN");
    // Serialize per-org so concurrent writes can't fork the chain.
    await client.query("SELECT pg_advisory_xact_lock($1)", [a.org_id || 0]);
    const prev = (await client.query(
      "SELECT hash FROM audit_log WHERE org_id IS NOT DISTINCT FROM $1 ORDER BY id DESC LIMIT 1", [row.org_id]
    )).rows[0]?.hash || "";
    const hash = hashOf(prev, payloadOf(row));
    await client.query(
      `INSERT INTO audit_log (org_id, actor_id, actor_name, action, target, details, ip, created_at, prev_hash, hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [row.org_id, row.actor_id, row.actor_name, row.action, row.target,
       row.details ? JSON.stringify(row.details) : null, ip, created_at, prev || null, hash]
    );
    await client.query("COMMIT");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
  } finally {
    client.release();
  }
}

// Walk an org's chain oldest→newest, recomputing each hash. Returns
// { ok, count, broken_at? } where broken_at is the id of the first bad row.
async function verifyChain(orgId) {
  const { rows } = await pool.query(
    `SELECT id, org_id, actor_id, actor_name, action, target, details, created_at, prev_hash, hash
     FROM audit_log WHERE org_id=$1 ORDER BY id ASC`, [orgId]
  );
  let prev = "";
  for (const r of rows) {
    const created_at = r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at;
    const expected = hashOf(prev, payloadOf({ ...r, created_at }));
    if (r.prev_hash !== (prev || null) && !(prev === "" && r.prev_hash === null)) return { ok: false, count: rows.length, broken_at: r.id };
    if (r.hash !== expected) return { ok: false, count: rows.length, broken_at: r.id };
    prev = r.hash;
  }
  return { ok: true, count: rows.length };
}

module.exports = { record, verifyChain };
