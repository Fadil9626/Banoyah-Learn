// The 3D practical's rules, run without a browser: a clean draw passes, each
// kind of mistake costs what the scenario says, critical errors fail whatever
// the score, and the browser's view never carries the answers.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const T0 = 1_000_000;
// Ibrahim Kamara: FBC + fasting glucose, purple then grey.
const run = (patientIndex = 0) => ({ st: engine.start("phleb-101", { now: T0, patientIndex }), t: T0 });
function act(r, action, dt = 2000) { r.t += dt; return engine.act(r.st, action, r.t); }
const label = (r, tube) => r.st.labels.find((l) => !l.decoy && l.tube === tube && !l.used).id;

// The right thing at every step. `skip` leaves out the steps named in it.
function cleanRun(r, { tubes = ["edta", "fluoride"] } = {}) {
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", ...tubes, "tourniquet", "sharps", "gauze"]) act(r, { type: "pick", id });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const t of tubes) act(r, { type: "label", label: label(r, t), tube: t });
}

test("a clean draw scores 100 and passes", () => {
  const r = run(); cleanRun(r);
  assert.equal(r.st.done, true);
  const g = engine.grade(r.st, { practicalMin: 85, finalPass: 85 });
  assert.equal(g.score, 100); assert.equal(g.passed, true); assert.equal(g.critical, false);
  assert.match(r.st.log.map((l) => l.what).join("\n"), /Labelled the purple top tube \(FBC\) at the chair/);
});

test("the second patient draws citrate before the gold tube", () => {
  const r = run(1); cleanRun(r, { tubes: ["citrate", "sst"] });
  assert.equal(engine.grade(r.st, { practicalMin: 85, finalPass: 85 }).passed, true);
});

test("reading the name off the form is critical: fails even with points to spare", () => {
  const r = run();
  act(r, { type: "say", choice: 1 }); act(r, { type: "continue" });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", "edta", "fluoride", "tourniquet", "sharps", "gauze"]) act(r, { type: "pick", id });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const t of ["edta", "fluoride"]) act(r, { type: "label", label: label(r, t), tube: t });
  const g = engine.grade(r.st, { practicalMin: 85, finalPass: 85 });
  assert.equal(g.score, 75); assert.equal(g.passed, false); assert.equal(g.critical, true);
  assert.match(r.st.crits[0].reason, /Passive identification/);
});

test("grey before purple costs 15 with the order-of-draw reason, and the draw still completes", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle"]) act(r, { type: "pick", id });
  const fb = act(r, { type: "pick", id: "fluoride" });
  assert.equal(r.st.score, 85);
  assert.match(fb[0].msg, /purple \(EDTA\) comes before grey/);
  act(r, { type: "pick", id: "edta" });
  assert.equal(r.st.step, 5, "on to finishing the draw");
});

test("a tube nobody ordered costs 10 and is not filled", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle"]) act(r, { type: "pick", id });
  act(r, { type: "pick", id: "citrate" });
  assert.equal(r.st.score, 90); assert.deepEqual(r.st.drawn, []);
});

test("the same mistake twice costs once", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  act(r, { type: "pick", id: "gloves" }); act(r, { type: "pick", id: "gloves" });
  assert.equal(r.st.score, 90);
  assert.equal(r.st.deds.length, 1);
});

test("the tourniquet clock is the server's: over a minute costs 10", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet"]) act(r, { type: "pick", id });
  act(r, { type: "pick", id: "swab" }, 30_000);
  for (const id of ["needle", "edta", "fluoride"]) act(r, { type: "pick", id }, 15_000);
  act(r, { type: "pick", id: "tourniquet" }, 5_000);
  assert.equal(r.st.score, 90);
  assert.match(r.st.deds[0].note, /tourniquet was on for 80 seconds/);
});

test("releasing the tourniquet once blood flows is good practice, and the next step skips it", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", "edta", "tourniquet", "fluoride", "sharps", "gauze"]) act(r, { type: "pick", id });
  assert.equal(r.st.score, 100);
  assert.equal(r.st.step, 6, "on to the patient asking to leave");
});

test("recapping, gloveless handling and the look-alike label are critical", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  act(r, { type: "pick", id: "needle" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", "edta", "fluoride", "tourniquet"]) act(r, { type: "pick", id });
  act(r, { type: "pick", id: "cap" });
  for (const id of ["sharps", "gauze"]) act(r, { type: "pick", id });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  const decoy = r.st.labels.find((l) => l.decoy).id;
  act(r, { type: "label", label: decoy, tube: "edta" });
  assert.equal(r.st.crits.length, 3);
  assert.match(r.st.crits.map((c) => c.reason).join(" "), /without gloves[\s\S]*recapped[\s\S]*different patient/);
});

test("letting the patient go before labelling is critical, and the run can still finish", () => {
  const r = run();
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", "edta", "fluoride", "tourniquet", "sharps", "gauze"]) act(r, { type: "pick", id });
  act(r, { type: "say", choice: 1 }); act(r, { type: "continue" });
  assert.equal(r.st.flags.gone, true);
  for (const t of ["edta", "fluoride"]) act(r, { type: "label", label: label(r, t), tube: t });
  assert.equal(r.st.done, true); assert.equal(engine.grade(r.st, { practicalMin: 85, finalPass: 85 }).passed, false);
  assert.match(r.st.log.at(-2).what, /after the patient had gone/);
});

test("the browser's view carries no costs, no criticals and no decoy flag", () => {
  const r = run();
  const v = engine.view(r.st, T0);
  assert.equal(v.current.choices.length, 4);
  assert.ok(v.current.choices.every((c) => Object.keys(c).join() === "id,text"));
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  for (const id of ["sanitiser", "gloves", "tourniquet", "swab", "needle", "edta", "fluoride", "tourniquet", "sharps", "gauze"]) act(r, { type: "pick", id });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  const lv = engine.view(r.st, r.t);
  assert.equal(lv.labels.length, 3);
  assert.ok(lv.labels.every((l) => !("decoy" in l)));
  assert.doesNotMatch(JSON.stringify(lv), /critical|delta|Passive identification/);
});

test("bad actions are refused without changing the run", () => {
  const r = run();
  assert.throws(() => act(r, { type: "continue" }), /Answer the patient first/);
  assert.throws(() => act(r, { type: "say", choice: 9 }), /not on offer/);
  assert.throws(() => act(r, { type: "pick", id: "scalpel" }), /no such thing/);
  assert.equal(r.st.score, 100);
  cleanRun(r);
  assert.throws(() => act(r, { type: "pick", id: "gauze" }), /already finished/);
});

test("the final mark weights theory and practical, 30/70 by default", () => {
  const r = run(); cleanRun(r);
  r.st.score = 90;                                   // a practical of 90
  const g = engine.grade(r.st, { theory: 80, finalPass: 80, practicalMin: 70 });
  assert.equal(g.final, 87);                         // 80 × 30% + 90 × 70%
  assert.equal(g.passed, true);
  assert.equal(engine.grade(r.st, { theory: 80, weight: 50, finalPass: 80 }).final, 85);
});

test("a strong quiz cannot carry a practical below its minimum", () => {
  const r = run(); cleanRun(r);
  r.st.score = 65;
  const g = engine.grade(r.st, { theory: 100, weight: 30, finalPass: 70, practicalMin: 70 });
  assert.equal(g.final, 90);                         // 100 × 70% + 65 × 30%: the quiz alone would carry it
  assert.equal(g.passed, false); assert.deepEqual(g.reasons, ["practical"]);
});

test("no quiz: the practical is the whole mark; a critical error fails whatever the numbers", () => {
  const r = run(); cleanRun(r);
  assert.equal(engine.grade(r.st, { theory: null, weight: 30, finalPass: 80 }).final, 100);
  r.st.crits.push({ step: "Label", reason: "x" });
  const g = engine.grade(r.st, { theory: 100, finalPass: 50 });
  assert.equal(g.passed, false); assert.deepEqual(g.reasons, ["critical"]);
});
