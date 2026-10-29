// SAFE-301's rules: sign and kit, PPE in any order, cover then the right
// disinfectant, the full contact time, glass with forceps into sharps, waste,
// wipe, wash, report. The opening is dealt at random, so each test pins it.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const run = (kase) => {
  const st = engine.start("safe-301", { now: 0, patientIndex: 0 });
  st.case = kase;
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
const OPEN = { floor: /Stop, don't touch it/, negative: /Treat it like any other/, splash: /Go to the eyewash now/ };
const REPORT = { floor: /incident form now/, negative: /incident form now/, splash: /post-exposure assessment now/ };
const clean = (r, bottle = "bleach1") => {
  say(r, OPEN[r.st.case]);
  pick(r, "sign", "spillkit", "goggles", "gloves", "apron", "paper", bottle);
  say(r, /Not yet/);
  pick(r, "forceps", "sharps", "biobag", bottle, "sink");
  say(r, REPORT[r.st.case]);
};

test("every opening, done right, passes at 100, with either strong bottle", () => {
  for (const k of ["floor", "negative", "splash"]) for (const b of ["bleach1", "bleach05"]) {
    const r = run(k); clean(r, b);
    assert.equal(r.st.done, true, k); assert.equal(r.st.score, 100, `${k} ${b}`); assert.equal(r.st.crits.length, 0);
  }
});

test("PPE goes on in any order, and a second pick is just 'already done'", () => {
  const r = run("floor");
  say(r, OPEN.floor); pick(r, "sign", "spillkit");
  const fb = pick(r, "apron", "apron");
  assert.match(fb.at(-1).msg, /Already done/);
  pick(r, "goggles", "gloves");
  assert.equal(view(r).current.id, "contain"); assert.equal(r.st.score, 100);
});

test("the routine 0.1% or alcohol costs points; the right one still finishes the step", () => {
  for (const wrong of ["bleach01", "alcohol"]) {
    const r = run("floor");
    say(r, OPEN.floor); pick(r, "sign", "spillkit", "gloves", "apron", "goggles", "paper");
    const fb = pick(r, wrong);
    assert.equal(fb[0].kind, "warn"); assert.match(fb[0].msg, /0\.5–1%/);
    assert.equal(r.st.score, 75);
    pick(r, "bleach05"); assert.equal(view(r).current.id, "wait");
  }
});

test("disinfectant before paper, and glass into the bag before the sharps bin, are out of order", () => {
  const r = run("floor");
  say(r, OPEN.floor); pick(r, "sign", "spillkit", "gloves", "apron", "goggles");
  pick(r, "bleach1"); assert.equal(r.st.score, 90);
  pick(r, "paper", "bleach1"); say(r, /Not yet/);
  pick(r, "forceps", "biobag"); assert.equal(r.st.score, 80);
});

test("picking up glass by hand, or skipping first aid for a splash, is critical", () => {
  let r = run("floor");
  say(r, /big bits of glass/); assert.equal(r.st.crits.length, 1);
  r = run("splash");
  say(r, /cleaned up first/); assert.match(r.st.crits[0].reason, /eyewash/);
});

test("a splash that isn't reported is critical; an unreported floor spill only costs points", () => {
  const r = run("splash");
  say(r, OPEN.splash); pick(r, "sign", "spillkit", "gloves", "apron", "goggles", "paper", "bleach1");
  say(r, /Not yet/); pick(r, "forceps", "sharps", "biobag", "bleach1", "sink");
  say(r, /Nothing to report/);
  assert.equal(r.st.done, true); assert.match(r.st.crits[0].reason, /72 hours/);
  const f = run("floor");
  say(f, OPEN.floor); pick(f, "sign", "spillkit", "gloves", "apron", "goggles", "paper", "bleach1");
  say(f, /Not yet/); pick(f, "forceps", "sharps", "biobag", "bleach1", "sink");
  say(f, /Nothing to report/);
  assert.equal(f.st.crits.length, 0); assert.equal(f.st.score, 85);
});

test("clearing before the contact time is up costs points", () => {
  const r = run("negative");
  say(r, OPEN.negative); pick(r, "sign", "spillkit", "gloves", "apron", "goggles", "paper", "bleach1");
  say(r, /couple of minutes/); assert.equal(r.st.score, 80);
});

test("the view never carries the case or the costs, and the bay sees what has been used", () => {
  const r = run("splash");
  say(r, OPEN.splash); pick(r, "sign", "spillkit");
  const v = view(r), s = JSON.stringify(v);
  assert.ok(!s.includes('"case"') && !s.includes("delta") && !s.includes("critical"));
  assert.deepEqual(v.specimen.used, ["sign", "spillkit"]);
  assert.equal(v.scenario.bay, "spill");
  assert.match(engine.subject(r.st), /splash in the eye/);
});
