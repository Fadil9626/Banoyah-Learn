// A lab's own figures for each practical, kept in org_settings under
// "practical:<scenario key>" as JSON: { values, signed_by, signed_on, updated_by, updated_at }.
const pool = require("../../config/db");

const keyOf = (scenario) => `practical:${scenario}`;

async function read(orgId, scenario, db = pool) {
  const row = (await db.query("SELECT value FROM org_settings WHERE org_id=$1 AND key=$2", [orgId, keyOf(scenario)])).rows[0];
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return null; }
}

const write = (orgId, scenario, record) => pool.query(
  "INSERT INTO org_settings (org_id, key, value) VALUES ($1,$2,$3) ON CONFLICT (org_id,key) DO UPDATE SET value=$3",
  [orgId, keyOf(scenario), JSON.stringify(record)]
);

const clear = (orgId, scenario) => pool.query("DELETE FROM org_settings WHERE org_id=$1 AND key=$2", [orgId, keyOf(scenario)]);

module.exports = { read, write, clear };
