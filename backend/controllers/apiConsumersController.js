const pool = require("../config/db");
const { generateKey } = require("../lib/apiKeys");

const publicConsumer = (c) => ({
  id: c.id, name: c.name, key_prefix: c.key_prefix, scopes: c.scopes,
  is_active: c.is_active, last_used_at: c.last_used_at, created_at: c.created_at,
});

// ── GET /api/api-consumers ───────────────────────────────────────────────────
const list = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM api_consumers WHERE org_id=$1 ORDER BY created_at DESC", [req.user.org_id]
    );
    return res.json(rows.map(publicConsumer));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/api-consumers ──────────────────────────────────────────────────
// Create a consumer + key. The plaintext key is returned ONCE.
const create = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "A name is required" });
  try {
    const { raw, hash, prefix } = generateKey();
    const { rows } = await pool.query(
      `INSERT INTO api_consumers (org_id, name, key_prefix, key_hash, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.org_id, name.trim(), prefix, hash, req.user.id]
    );
    // Return the full key exactly once — it cannot be retrieved again.
    return res.status(201).json({ ...publicConsumer(rows[0]), key: raw });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── POST /api/api-consumers/:id/revoke ───────────────────────────────────────
const revoke = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE api_consumers SET is_active=false WHERE id=$1 AND org_id=$2 RETURNING *",
      [req.params.id, req.user.org_id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    return res.json(publicConsumer(rows[0]));
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

// ── DELETE /api/api-consumers/:id ────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM api_consumers WHERE id=$1 AND org_id=$2", [req.params.id, req.user.org_id]
    );
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    return res.json({ message: "Deleted" });
  } catch (e) { return res.status(500).json({ message: e.message }); }
};

module.exports = { list, create, revoke, remove };
