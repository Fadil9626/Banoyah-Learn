// CHEM-202's rules: check before you act; release and phone a real critical with
// a read-back; stop a false one (haemolysis, EDTA) with the right reason; hold a
// run whose QC failed, fix it and re-run. The case is dealt at random, so each
// test pins it.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const run = (kase, rbWrong = false) => {
  const st = engine.start("chem-202", { now: 0, patientIndex: 0 });
  st.case = kase; st.vars.rbWrong = rbWrong;
  return { st, t: 0 };
};
const act = (r, a) => { r.t += 1500; return engine.act(r.st, a, r.t); };
const view = (r) => engine.view(r.st, r.t);
const say = (r, re) => {
  const c = view(r).current.choices.find((x) => re.test(x.text));
  assert.ok(c, `no choice matching ${re} in ${view(r).current.id}`);
  const fb = act(r, { type: "say", choice: c.id }); act(r, { type: "continue" }); return fb;
};
const checkAll = (r, ids = ["tube", "analyser", "qc", "terminal"]) => { for (const id of ids) act(r, { type: "pick", id }); act(r, { type: "continue" }); };
const phoneIt = (r) => {
  say(r, /put me through/); say(r, /Please read it back/);
  if (r.st.vars.rbWrong) say(r, /No, that's not right/); else say(r, /That's correct/);
};

test("a real critical, checked, released and read back, passes at 100", () => {
  for (const rb of [false, true]) {
    const r = run("genuine", rb);
    say(r, /Not yet/); checkAll(r); say(r, /It's real/); phoneIt(r);
    assert.equal(r.st.done, true); assert.equal(r.st.score, 100); assert.equal(r.st.crits.length, 0);
  }
});

test("findings show only what has been checked", () => {
  const r = run("haem");
  say(r, /Not yet/);
  assert.deepEqual(view(r).findings, []);
  act(r, { type: "pick", id: "tube" });
  const f = view(r).findings;
  assert.equal(f.length, 1); assert.match(f[0].lines[0], /haemolysed/);
  assert.ok(!JSON.stringify(view(r)).includes('"case"'), "the case name never reaches the browser");
});

test("releasing a haemolysed or EDTA-contaminated potassium is critical", () => {
  for (const k of ["haem", "edta"]) {
    const r = run(k);
    say(r, /Not yet/); checkAll(r); say(r, /It's real/); phoneIt(r);
    assert.equal(r.st.crits.length, 1, k); assert.match(r.st.crits[0].reason, /false/);
  }
});

test("stopping a false result with the right cause, and saying why, passes at 100", () => {
  for (const [k, re] of [["haem", /haemolysed: comment/], ["edta", /EDTA contamination/]]) {
    const r = run(k);
    say(r, /Not yet/); checkAll(r); say(r, re); say(r, /Please recollect it urgently/);
    assert.equal(r.st.done, true); assert.equal(r.st.score, 100, k);
  }
});

test("the wrong cause costs a little; giving out a false result is critical", () => {
  const r = run("edta");
  say(r, /Not yet/); checkAll(r); say(r, /haemolysed: comment/);
  assert.equal(r.st.score, 90);
  say(r, /probably wrong/);
  assert.equal(r.st.crits.length, 1);
});

test("withholding a real critical is critical", () => {
  const r = run("genuine");
  say(r, /Not yet/); checkAll(r); say(r, /EDTA contamination/);
  assert.equal(r.st.crits.length, 1); assert.match(r.st.crits[0].reason, /real/);
});

test("a QC failure: hold, re-run the QC and the sample, then phone the re-run result", () => {
  const r = run("qc");
  say(r, /Not yet/); checkAll(r); say(r, /QC is out/);
  assert.equal(view(r).current.id, "fix");
  act(r, { type: "pick", id: "qcvials" }); act(r, { type: "pick", id: "analyser" });
  assert.equal(r.st.vars.qcFixed, true);
  assert.equal(view(r).current.id, "call");
  assert.match(view(r).findings.find((f) => f.id === "analyser").rows.find((x) => x[0] === "Potassium")[1], /7\.6/);
  say(r, /put me through/);
  const give = view(r).current.choices.find((c) => /Please read it back/.test(c.text));
  assert.match(give.text, /potassium 7\.6/);
  say(r, /Please read it back/); say(r, /That's correct/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 100);
});

test("releasing from a failed QC run is critical", () => {
  const r = run("qc");
  say(r, /Not yet/); checkAll(r); say(r, /It's real/);
  assert.equal(r.st.crits.length, 1); assert.match(r.st.crits[0].reason, /1-3s/);
});

test("blaming the QC when it was fine costs, and asks again without that answer", () => {
  const r = run("genuine");
  say(r, /Not yet/); checkAll(r); say(r, /QC is out/);
  assert.equal(view(r).current.id, "decide");
  assert.equal(r.st.score, 90);
  assert.equal(view(r).current.choices.length, 3);
  assert.ok(!view(r).current.choices.some((c) => /QC is out/.test(c.text)));
  say(r, /It's real/); phoneIt(r);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 90);
});

test("skipping a check costs, once each", () => {
  const r = run("genuine");
  say(r, /Not yet/); checkAll(r, ["tube"]); say(r, /It's real/); phoneIt(r);
  assert.equal(r.st.score, 80);
});

test("agreeing to a wrong read-back is critical", () => {
  const r = run("genuine", true);
  say(r, /Not yet/); checkAll(r); say(r, /It's real/); say(r, /put me through/); say(r, /Please read it back/);
  assert.match(view(r).current.say, /8\.7/);
  say(r, /Yes, that's right/);
  assert.equal(r.st.crits.length, 1); assert.match(r.st.crits[0].reason, /8\.7 instead of 7\.8/);
});

test("a message through the clerk costs, and posting it in ELIMS alone is critical", () => {
  let r = run("genuine");
  say(r, /Not yet/); checkAll(r); say(r, /It's real/); say(r, /pass a message/);
  assert.equal(r.st.score, 75);
  r = run("genuine");
  say(r, /Not yet/); checkAll(r); say(r, /It's real/); say(r, /put it in ELIMS/);
  assert.equal(r.st.crits.length, 1);
});
