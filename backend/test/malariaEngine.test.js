// MAL-201's rules: the film before the RDT; thick and thin films read, the
// parasites counted (or, for a negative, the full search done); the right report
// for what the film showed, a severe density phoned with read-back. The case is
// dealt at random, so each test pins it.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const run = (kase, rbWrong = false, cfg) => {
  const st = engine.start("mal-201", { now: 0, patientIndex: 0, cfg });
  st.case = kase; st.vars.rbWrong = rbWrong;
  return { st, t: 0 };
};
const act = (r, a) => { r.t += 1500; return engine.act(r.st, a, r.t); };
const view = (r) => engine.view(r.st, r.t);
const pick = (r, ...ids) => ids.flatMap((id) => act(r, { type: "pick", id }));
const say = (r, re) => {
  const c = view(r).current.choices.find((x) => re.test(x.text));
  assert.ok(c, `no choice matching ${re} in ${view(r).current.id}: ${view(r).current.choices.map((x) => x.text).join(" | ")}`);
  const fb = act(r, { type: "say", choice: c.id }); act(r, { type: "continue" }); return fb;
};
const toDecide = (r, look) => {
  say(r, /We'll do the film now/);
  pick(r, "tube", "slides", "stain", "microscope");
  pick(r, ...(look || ["thick", "thin", "count", "more", "terminal"])); act(r, { type: "continue" });
};

test("each case, read and reported right, passes at 100", () => {
  let r = run("falciparum"); toDecide(r); say(r, /species and the density/); say(r, /P\. falciparum seen\. 1,920/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 100);
  r = run("negative"); toDecide(r); say(r, /No malaria parasites in 100/); say(r, /No malaria parasites seen in 100/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 100);
  for (const rb of [false, true]) {
    r = run("severe", rb); toDecide(r); say(r, /severe density/); say(r, /critical result for/); say(r, rb ? /No: 325,000/ : /That's correct/);
    assert.equal(r.st.done, true); assert.equal(r.st.score, 100, `rb ${rb}`);
  }
});

test("the density follows the lab's white-cell figure", () => {
  const r = run("falciparum", false, { wbc_assumed: 6000 }); toDecide(r);
  const count = view(r).findings.find((f) => f.id === "count");
  assert.match(count.lines[1], /48 × 6,000 ÷ 200 = 1,440/);
});

test("a negative needs the full search; a positive needs a count", () => {
  let r = run("negative"); toDecide(r, ["thick", "thin"]);
  assert.equal(r.st.score, 80); assert.match(r.st.deds[0].note, /100 thick-film fields/);
  r = run("falciparum"); toDecide(r, ["thick", "thin"]);
  assert.equal(r.st.score, 85);
});

test("going by the RDT: costs points when it happens to be right, critical when it is not", () => {
  let r = run("falciparum"); toDecide(r); say(r, /RDT was positive anyway/); assert.equal(r.st.score, 90); assert.equal(r.st.crits.length, 0);
  assert.equal(view(r).current.id, "record");
  r = run("negative"); toDecide(r); say(r, /RDT was positive anyway/); assert.match(r.st.crits[0].reason, /HRP2/);
});

test("a severe density reported as routine is critical; agreeing to 32,500 is critical", () => {
  let r = run("severe"); toDecide(r); say(r, /species and the density\.$/); assert.match(r.st.crits[0].reason, /IV artesunate/);
  r = run("severe", true); toDecide(r); say(r, /severe density/); say(r, /critical result for/); say(r, /Yes, that's it/);
  assert.match(r.st.crits[0].reason, /32,500 instead of 325,000/);
});

test("the severe level is the lab's: a lower one makes the routine case no different, the wording follows it", () => {
  const r = run("falciparum", false, { severe_density: 100000 }); toDecide(r); say(r, /severe density/);
  assert.match(r.st.deds[0].note, /100,000\/µL/);
});

test("the view never carries the case, and film fields carry only drawing numbers", () => {
  const r = run("severe"); toDecide(r);
  const s = JSON.stringify(view(r));
  assert.ok(!s.includes('"case"') && !s.includes("delta") && !s.includes("critical\""));
  const thin = view(r).findings.find((f) => f.id === "thin");
  assert.equal(thin.type, "field"); assert.equal(thin.multi, true);
});
