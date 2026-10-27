// RECEP-102's rules: a careful check passes, accepting a label problem is
// critical, rejecting a good sample costs, the wrong reason costs a little, and
// relabelling on the phone is critical. Faults are dealt at random, so every
// test reads the answers from the run itself.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");
const { DEFECTS } = require("../lib/practical/scenarios/recep102");

const run = () => ({ st: engine.start("recep-102", { now: 0, patientIndex: 0 }), t: 0 });
const act = (r, a) => { r.t += 1500; return engine.act(r.st, a, r.t); };
const right = (S) => (S.defect ? { verdict: "reject", reason: DEFECTS[S.defect].reason } : { verdict: "accept" });

function check(r, decideAs = right) {
  for (const S of r.st.samples) {
    act(r, { type: "inspect", sample: S.id });
    act(r, { type: "decide", sample: S.id, ...decideAs(S) });
  }
}
const choose = (r, re) => {
  const s = engine.view(r.st, r.t).current;
  const c = s.choices.find((x) => re.test(x.text));
  assert.ok(c, `no choice matching ${re}`);
  act(r, { type: "say", choice: c.id }); act(r, { type: "continue" });
};

test("every run deals one label problem, two other faults and two good samples", () => {
  for (let i = 0; i < 30; i++) {
    const { st } = run();
    const d = st.samples.map((s) => s.defect);
    assert.equal(d.filter((x) => x === "mismatch" || x === "unlabelled").length, 1);
    assert.equal(d.filter((x) => x === null).length, 2);
    assert.equal(new Set(st.samples.map((s) => s.who.name)).size, 5);
  }
});

test("a careful check and a proper call pass at 100", () => {
  const r = run();
  choose(r, /check each sample/); check(r); choose(r, /Please recollect them/);
  assert.equal(r.st.done, true);
  const g = engine.grade(r.st, { finalPass: 80 });
  assert.equal(g.score, 100); assert.equal(g.passed, true);
});

test("accepting the sample with a label problem is critical", () => {
  const r = run();
  choose(r, /check each sample/);
  check(r, (S) => (S.defect === "mismatch" || S.defect === "unlabelled" ? { verdict: "accept" } : right(S)));
  assert.equal(r.st.crits.length, 1);
  assert.match(r.st.crits[0].reason, /recollected/);
});

test("rejecting a good sample costs 10; the right call with the wrong reason costs 5", () => {
  const r = run();
  choose(r, /check each sample/);
  const good = r.st.samples.find((s) => !s.defect), bad = r.st.samples.find((s) => s.defect && s.defect !== "mismatch" && s.defect !== "unlabelled");
  const wrong = engine.view(r.st, 0).reasons.find((x) => x !== DEFECTS[bad.defect].reason);
  check(r, (S) => (S === good ? { verdict: "reject", reason: "Clotted Sample" } : S === bad ? { verdict: "reject", reason: wrong } : right(S)));
  assert.equal(r.st.score, 85);
});

test("asking the ward to fix the label is critical; the trap is only offered after a label rejection", () => {
  const r = run();
  choose(r, /check each sample/); check(r);
  assert.equal(engine.view(r.st, r.t).current.choices.length, 4);
  choose(r, /correct it/);
  assert.match(r.st.crits[0].reason, /Never relabel/);
});

test("a sample has to be picked up before it is decided, and a decision stands", () => {
  const r = run();
  choose(r, /check each sample/);
  const S = r.st.samples[0];
  assert.throws(() => act(r, { type: "decide", sample: S.id, verdict: "accept" }), /look at it first/);
  act(r, { type: "inspect", sample: S.id }); act(r, { type: "decide", sample: S.id, ...right(S) });
  assert.throws(() => act(r, { type: "decide", sample: S.id, verdict: "accept" }), /already been decided/);
  assert.throws(() => act(r, { type: "decide", sample: r.st.samples[1].id, verdict: "reject", reason: "Because" }), /look at it first|Choose a reason/);
});

test("the browser never learns what is wrong with a sample", () => {
  const r = run();
  const json = JSON.stringify(engine.view(r.st, 0));
  assert.doesNotMatch(json, /"defect"|mismatch|unlabelled|haemolysed|underfilled|wrongtube/);
});
