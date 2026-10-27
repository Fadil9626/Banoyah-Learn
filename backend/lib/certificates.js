// Issuing a certificate, in one place. The quiz and the 3D practical both end
// here, so a certificate means the same thing — same serial, same expiry rule,
// same audit line and webhook — whichever assessment earned it.
const crypto = require("crypto");
const pool = require("../config/db");
const audit = require("./audit");
const webhooks = require("./webhooks");

// Short, human-ish unique certificate serial, e.g. BL-7F3A9C2E.
const makeSerial = () => "BL-" + crypto.randomBytes(4).toString("hex").toUpperCase();

/**
 * Issue (or refresh) the caller's certificate for a course.
 * @param {object} req     the request, for the learner and the audit line
 * @param {object} course  the course row
 * @param {number} score   the score that earned it
 * @param {object} [via]   extra audit details, e.g. { practical_session: 12 }
 */
async function issue(req, course, score, via = {}) {
  const until = course.validity_months
    ? new Date(Date.now() + course.validity_months * 30 * 86400000).toISOString()
    : null;
  const certificate = (await pool.query(
    `INSERT INTO certificates (org_id, user_id, course_id, serial, score, certified_until)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, course_id)
     DO UPDATE SET score=EXCLUDED.score, certified_until=EXCLUDED.certified_until,
                   issued_at=NOW(), last_reminder_day=NULL
     RETURNING *`,
    [req.user.org_id, req.user.id, course.id, makeSerial(), score, until]
  )).rows[0];
  audit.record(req, "certificate.issue", { target: course.title, details: { score, serial: certificate.serial, ...via } });
  const ext = (await pool.query("SELECT external_id FROM users WHERE id=$1", [req.user.id])).rows[0]?.external_id || null;
  webhooks.emit(req.user.org_id, "certification.completed", {
    external_id: ext, learner: req.user.name, user_id: req.user.id,
    course: course.title, course_id: course.id, serial: certificate.serial,
    score, certified_until: certificate.certified_until,
  });
  return certificate;
}

module.exports = { issue };
