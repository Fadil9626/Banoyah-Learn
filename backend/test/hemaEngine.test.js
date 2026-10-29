// HEMA-201's rules: check the tube, the count and the QC; make, stain and look
// at a film (the feathered edge as well as the body); then the right action for
// what it showed: phone a real critical with read-back, ask for citrate for
// clumps, reject a clotted sample. The case is dealt at random, so each test pins it.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const run = (kase, rbWrong = false) => {
  const st = engine.start("hema-201", { now: 0, patientIndex: 0 });
  st.case = kase; st.vars.rbWrong = rbWrong;
  return { st, t: 0 };
};
const act = (r, a) => { r.t += 1500; return engine.act(r.st, a, r.t); };
const view = (r) => engine.view(r.st, r.t);
const pick = (r, ...ids) => ids.flatMap((id) => act(r, { type: "pick", id }));
const say = (r, re) => {
  const c = view(r).current.choices.find((x) => re.test(x.text));
  assert.ok(c, `no choice matching ${re} in ${view(r).current.id}`);
  const fb = act(r, { type: "say", choice: c.id }); act(r, { type: "continue" }); return fb;
};
const toDecide = (r, look = ["feather", "body", "count"]) => {
  say(r, /Not yet/);
  pick(r, "tube", "analyser", "qc", "terminal"); act(r, { type: "continue" });
  pick(r, "tube", "slides", "stain", "microscope");
  pick(r, ...look); act(r, { type: "continue" });
};
const DECIDE = { true: /It's real/, clumps: /clumping in the EDTA/, clot: /partly clotted: ask/ };

test("each case, checked and decided right, passes at 100", () => {
  for (const rb of [false, true]) {
    const r = run("true", rb); toDecide(r); say(r, DECIDE.true);
    say(r, /put me through/); say(r, /Please read it back/); say(r, rb ? /No, that's not right/ : /That's correct/);
    assert.equal(r.st.done, true); assert.equal(r.st.score, 100); assert.equal(r.st.crits.length, 0);
  }
  for (const k of ["clumps", "clot"]) {
    const r = run(k); toDecide(r); say(r, DECIDE[k]); say(r, /This is the lab about/);
    assert.equal(r.st.done, true, k); assert.equal(r.st.score, 100, k);
  }
});

test("the film steps go in order: mix, spread, stain, microscope", () => {
  const r = run("clumps");
  say(r, /Not yet/); pick(r, "tube", "analyser", "qc"); act(r, { type: "continue" });
  pick(r, "slides"); assert.equal(r.st.score, 95);
  pick(r, "tube", "slides", "microscope"); assert.equal(r.st.score, 90);
  pick(r, "stain", "microscope"); assert.equal(view(r).current.id, "look");
});

test("the microscope fields are offered as buttons, and skipping the feathered edge costs 15", () => {
  const r = run("clumps");
  say(r, /Not yet/); pick(r, "tube", "analyser", "qc"); act(r, { type: "continue" });
  pick(r, "tube", "slides", "stain", "microscope");
  const v = view(r);
  assert.deepEqual(v.current.clues.map((c) => c.id), ["feather", "body", "count"]);
  assert.equal(v.current.doneText, "I've looked: decide");
  const fb = pick(r, "microscope"); assert.match(fb[0].msg, /Choose where on the film/);
  pick(r, "body"); act(r, { type: "continue" });
  assert.equal(r.st.score, 85); assert.equal(view(r).current.id, "decide");
});

test("a film field carries drawing numbers, never the case", () => {
  const r = run("clot"); toDecide(r);
  const f = view(r).findings.find((x) => x.id === "feather");
  assert.equal(f.type, "field"); assert.ok(f.fibrin > 0 && f.clumps > 0);
  const s = JSON.stringify(view(r));
  assert.ok(!s.includes('"case"') && !s.includes("clot\"") && !s.includes("delta"));
});

test("releasing a false count is critical; withholding a real one is critical", () => {
  for (const k of ["clumps", "clot"]) { const r = run(k); toDecide(r); say(r, DECIDE.true); assert.equal(r.st.crits.length, 1, k); }
  const r = run("true"); toDecide(r); say(r, DECIDE.clumps); assert.match(r.st.crits[0].reason, /real/);
});

test("the right refusal with the wrong cause costs 10; a re-run only sends you back", () => {
  let r = run("clumps"); toDecide(r); say(r, DECIDE.clot); assert.equal(r.st.score, 90);
  r = run("clot"); toDecide(r); say(r, /analyser again/);
  assert.equal(view(r).current.id, "decide"); assert.equal(view(r).current.choices.length, 3); assert.equal(r.st.score, 95);
});

test("agreeing to 'eighty' for eighteen is critical", () => {
  const r = run("true", true); toDecide(r); say(r, DECIDE.true);
  say(r, /put me through/); say(r, /Please read it back/); say(r, /Yes, that's right/);
  assert.match(r.st.crits[0].reason, /80 instead of 18/);
});
