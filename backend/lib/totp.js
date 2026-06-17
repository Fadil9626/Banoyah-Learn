// Dependency-free TOTP (RFC 6238 / HOTP RFC 4226), SHA-1, 6 digits, 30s period —
// compatible with Google Authenticator, Authy, 1Password, etc. verify() returns
// the matched time-step so the caller can store it and reject replays.
const crypto = require("crypto");

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateSecret(bytes = 20) {
  const buf = crypto.randomBytes(bytes);
  let bits = "", out = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
}

function base32Decode(s) {
  const clean = String(s).replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const c of clean) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | ((h[o + 1] & 0xff) << 16) | ((h[o + 2] & 0xff) << 8) | (h[o + 3] & 0xff);
  return (code % 1_000_000).toString().padStart(6, "0");
}

const step = (t = Date.now()) => Math.floor(t / 1000 / 30);

// Returns the matched step (number) or null. Window of ±1 absorbs clock drift.
function verify(secret, token, window = 1) {
  if (!secret || !token) return null;
  const t = String(token).trim();
  if (!/^\d{6}$/.test(t)) return null;
  const s = step();
  for (let i = -window; i <= window; i++) {
    if (crypto.timingSafeEqual(Buffer.from(hotp(secret, s + i)), Buffer.from(t))) return s + i;
  }
  return null;
}

const keyUri = (secret, label, issuer = "Banoyah Learn") =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}` +
  `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

module.exports = { generateSecret, hotp, step, verify, keyUri };
