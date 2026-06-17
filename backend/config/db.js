require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set. Copy .env.example to .env and configure it.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on("error", (e) => console.error("Postgres pool error:", e.message));

module.exports = pool;
