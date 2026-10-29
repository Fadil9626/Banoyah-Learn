// Competency: the state of one person on one practical, and where points go
// across a set of runs.
const test = require("node:test");
const assert = require("node:assert/strict");
const { cellFor, weakPoints } = require("../controllers/competencyController");

const NOW = Date.parse("2026-10-29T12:00:00Z"), DAY = 86_400_000;
const at = (days) => new Date(NOW + days * DAY).toISOString();

test("a valid certificate is competent; inside the reminder window it is due", () => {
  assert.equal(cellFor({ cert: { certified_until: at(200), serial: "A" } }, 30, NOW).status, "competent");
  const due = cellFor({ cert: { certified_until: at(12), serial: "A" } }, 30, NOW);
  assert.equal(due.status, "due"); assert.equal(due.days, 12);
  assert.equal(cellFor({ cert: { certified_until: null, serial: "A" } }, 30, NOW).status, "competent");
});

test("a lapsed certificate is expired, even if a later exam failed", () => {
  const c = cellFor({ cert: { certified_until: at(-3), serial: "A" }, exam: { id: 9, passed: false } }, 30, NOW);
  assert.equal(c.status, "expired"); assert.equal(c.session_id, 9);
});

test("no certificate: a failed last exam, then started, then not started", () => {
  const f = cellFor({ exam: { id: 4, passed: false, critical: true, score: 70, attempts: 2 } }, 30, NOW);
  assert.deepEqual([f.status, f.critical, f.attempts], ["failed", true, 2]);
  assert.equal(cellFor({ begun: true }, 30, NOW).status, "in_progress");
  assert.equal(cellFor({}, 30, NOW).status, "not_started");
});

test("mistakes group across runs whatever their numbers; criticals come first", () => {
  const runs = [
    { crits: [], deds: [{ step: "Finish draw", delta: -10, note: "The tourniquet was on for 80 seconds." }] },
    { crits: [], deds: [{ step: "Finish draw", delta: -10, note: "The tourniquet was on for 95 seconds." }, { step: "Draw", delta: -15, note: "Order of draw." }] },
    { crits: [{ step: "Label", reason: "Look-alike label." }], deds: [] },
    { crits: [], deds: [] },
  ];
  const w = weakPoints(runs);
  assert.equal(w[0].critical, true); assert.equal(w[0].runs, 1);
  assert.equal(w[1].step, "Finish draw"); assert.equal(w[1].runs, 2); assert.equal(w[1].pct, 50);
  assert.equal(w.length, 3);
});
