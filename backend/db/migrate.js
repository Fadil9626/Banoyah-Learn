// Tiny forward-only migration runner. Runs every *.sql in db/migrations in
// filename order, once each, inside a transaction, tracking applied files in
// schema_migrations. Migrations should still be written idempotently
// (CREATE TABLE IF NOT EXISTS …) so a partial environment self-heals.
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const dir = path.join(__dirname, "migrations");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    : [];

  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  const done = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`✓ migrated ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${e.message}`);
    } finally {
      client.release();
    }
  }
}

module.exports = migrate;
