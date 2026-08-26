// ─────────────────────────────────────────────────────────────────────────────
// Settles exam sittings that ran out without being submitted.
//
// The countdown in the browser submits the paper when it reaches zero, but only
// while the page is open. Close the tab and nothing is ever sent — and until
// something settles that sitting, no attempt exists, so the candidate simply
// starts again on a fresh paper. Repeat, and the whole question bank is theirs
// with max_attempts untouched.
//
// So the server settles them instead: an expired, unsubmitted sitting becomes a
// failed attempt (score 0), which is what "you ran out of time" should mean.
// Courses can opt out via courses.abandon_counts.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require("../config/db");

// A submission still in flight must never be swept out from under the person
// who sent it. The submit path allows 30s of slack past the deadline, so the
// background sweep stands well clear of it.
const SWEEP_GRACE_SECONDS = 120;
const INTERVAL_MS = 5 * 60_000;

// Closing the sitting and recording the attempt happen in one statement, so two
// sweeps racing — or a sweep racing the request path — cannot double-count: the
// UPDATE only returns rows it actually claimed.
const SQL = `
  WITH stale AS (
    UPDATE quiz_sessions s
       SET submitted_at = NOW()
      FROM courses c
     WHERE c.id = s.course_id
       AND s.submitted_at IS NULL
       AND s.expires_at IS NOT NULL
       AND s.expires_at < NOW() - make_interval(secs => $1::int)
       AND ($2::int IS NULL OR s.enrollment_id = $2::int)
    RETURNING s.enrollment_id, c.abandon_counts
  ), scored AS (
    INSERT INTO attempts (enrollment_id, score, passed, answers)
    SELECT enrollment_id, 0, FALSE, '{"abandoned":true}'::jsonb
      FROM stale WHERE abandon_counts
    RETURNING id
  )
  SELECT (SELECT COUNT(*) FROM stale)::int  AS closed,
         (SELECT COUNT(*) FROM scored)::int AS scored`;

/**
 * Settle expired sittings.
 * @param {object} opts
 * @param {number} [opts.enrollmentId]   limit to one enrolment (request path)
 * @param {number} [opts.graceSeconds]   seconds past the deadline before sweeping
 * @returns {Promise<{closed:number, scored:number}>}
 */
async function sweep({ enrollmentId = null, graceSeconds = SWEEP_GRACE_SECONDS } = {}) {
  const { rows } = await pool.query(SQL, [graceSeconds, enrollmentId]);
  return rows[0] || { closed: 0, scored: 0 };
}

let timer = null;

async function tick() {
  try {
    const r = await sweep();
    if (r.closed) console.log(`[exams] settled ${r.closed} expired sitting(s), ${r.scored} recorded as failed`);
  } catch (e) {
    // Never let a sweep failure take the process down — the next tick retries,
    // and the request path settles anything a learner comes back to anyway.
    console.error("[exams] sweep error:", e.message);
  }
}

function start() {
  if (timer) return;
  setTimeout(tick, 20_000).unref?.();      // once shortly after boot
  timer = setInterval(tick, INTERVAL_MS);
  timer.unref?.();
  console.log("[exams] abandoned-sitting sweeper started");
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
}

module.exports = { sweep, start, stop, SWEEP_GRACE_SECONDS };
