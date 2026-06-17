const crypto = require("crypto");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Generate a new API key. The raw value is returned to the caller ONCE; only
// its hash + a display prefix are persisted.
function generateKey() {
  const raw = "blk_" + crypto.randomBytes(24).toString("hex"); // blk_ + 48 hex chars
  return { raw, hash: sha256(raw), prefix: raw.slice(0, 12) };
}

module.exports = { sha256, generateKey };
