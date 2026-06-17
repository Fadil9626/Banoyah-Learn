// In-memory brute-force guard for login. Tracks failures per email+IP and locks
// the pair for a cooldown after too many. Good enough for a single instance; a
// multi-instance deploy would move this to Redis.
const MAX = 5;                    // failures before lock
const WINDOW = 15 * 60 * 1000;    // failures counted within this window
const LOCK = 15 * 60 * 1000;      // lock duration

const attempts = new Map(); // key -> { count, first, lockedUntil }
const keyFor = (email, ip) => `${(email || "").toLowerCase()}|${ip || ""}`;

function check(email, ip) {
  const e = attempts.get(keyFor(email, ip));
  const now = Date.now();
  if (e?.lockedUntil > now) return { locked: true, retryAfter: Math.ceil((e.lockedUntil - now) / 1000) };
  return { locked: false };
}

function fail(email, ip) {
  const k = keyFor(email, ip);
  const now = Date.now();
  let e = attempts.get(k);
  if (!e || now - e.first > WINDOW) e = { count: 0, first: now, lockedUntil: 0 };
  e.count++;
  if (e.count >= MAX) e.lockedUntil = now + LOCK;
  attempts.set(k, e);
}

const reset = (email, ip) => attempts.delete(keyFor(email, ip));

// Periodic cleanup of stale entries.
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of attempts) if ((e.lockedUntil || 0) < now && now - e.first > WINDOW) attempts.delete(k);
}, 10 * 60 * 1000).unref?.();

module.exports = { check, fail, reset, MAX };
