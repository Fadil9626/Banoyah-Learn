// A lab's own figures: checked against each scenario's declarations, copied
// into a run when it starts, and followed by the run from then on.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const start = (key, cfg, extra = {}) => ({ st: engine.start(key, { now: 0, patientIndex: 0, cfg, ...extra }), t: 0 });
const act = (r, a, dt = 1500) => { r.t += dt; return engine.act(r.st, a, r.t); };
const view = (r) => engine.view(r.st, r.t);
const pick = (r, ...ids) => ids.flatMap((id) => act(r, { type: "pick", id }));
const say = (r, re) => {
  const c = view(r).current.choices.find((x) => re.test(x.text));
  assert.ok(c, `no choice matching ${re} in ${view(r).current.id}`);
  const fb = act(r, { type: "say", choice: c.id }); act(r, { type: "continue" }); return fb;
};

test("every practical declares its figures with a default inside its own range", () => {
  for (const { key } of engine.list()) for (const f of engine.settings(key)) {
    assert.ok(f.key && f.label && f.type, `${key}: ${JSON.stringify(f)}`);
    if (f.type === "number") assert.ok(f.default >= f.min && f.default <= f.max, `${key}.${f.key}`);
    if (f.type === "choice") assert.ok(f.options.some(([o]) => o === f.default), `${key}.${f.key}`);
  }
});

test("figures are checked: missing ones take the default, bad ones are refused", () => {
  assert.deepEqual(engine.cleanSettings("chem-202", {}).errors, []);
  assert.equal(engine.cleanSettings("chem-202", {}).values.k_critical_high, 6.5);
  const bad = engine.cleanSettings("chem-202", { k_critical_high: 8, h_index_cutoff: "lots" });
  assert.equal(bad.errors.length, 2); assert.match(bad.errors[0], /between 6 and 7.5 mmol\/L/);
  assert.equal(bad.values.k_critical_high, 6.5);
  assert.match(engine.cleanSettings("safe-301", { strength: "2" }).errors[0], /choose one/);
  assert.equal(engine.cleanSettings("hema-201", { stain_name: "  Giemsa   10% " }).values.stain_name, "Giemsa 10%");
  assert.equal(engine.cleanSettings("safe-301", { glass_first: "true" }).values.glass_first, true);
});

test("a run keeps the figures it started with", () => {
  const cfg = { k_critical_high: 7.0 };
  const r = start("chem-202", cfg);
  cfg.k_critical_high = 6.0;
  assert.equal(r.st.cfg.k_critical_high, 7.0);
});

test("PHLEB-101: the tourniquet limit is the lab's", () => {
  const r = start("phleb-101", { tourniquet_limit: 90 });
  act(r, { type: "say", choice: 0 }); act(r, { type: "continue" }); act(r, { type: "say", choice: 0 }); act(r, { type: "continue" });
  pick(r, "sanitiser", "gloves", "tourniquet");
  act(r, { type: "pick", id: "swab" }, 30_000);
  for (const id of ["needle", "edta", "fluoride"]) act(r, { type: "pick", id }, 15_000);
  act(r, { type: "pick", id: "tourniquet" }, 5_000);      // on for 80 s: fine under 90
  assert.equal(r.st.score, 100);
  assert.equal(view(r).tq_limit, 90);
});

test("CHEM-202: the critical limit, the reference range and the H-index cut-off show in the findings", () => {
  const r = start("chem-202", { k_critical_high: 7.0, k_ref_low: 3.6, k_ref_high: 5.1, h_index_cutoff: 50 });
  r.st.case = "genuine";
  say(r, /Not yet/); pick(r, "tube", "analyser");
  const [tube, panel] = view(r).findings;
  assert.match(tube.lines[1], /H 50 or more/);
  const k = panel.rows.find((x) => x[0] === "Potassium");
  assert.deepEqual(k, ["Potassium", "7.8", "3.6–5.1", "CRITICAL"]);
});

test("HEMA-201: the critical limit, the estimate factor and the stain are the lab's", () => {
  const r = start("hema-201", { plt_critical_low: 30, estimate_factor: 20, stain_name: "Giemsa" });
  r.st.case = "true";
  say(r, /Not yet/); pick(r, "analyser"); act(r, { type: "continue" });
  assert.equal(view(r).objects.stain[1], "Giemsa stain and buffer");
  pick(r, "tube", "slides", "stain", "microscope", "count");
  const est = view(r).findings.find((f) => f.id === "count");
  assert.match(est.lines[1], /1.2 × 20 ≈ 24/);
  assert.ok(r.st.log.some((l) => /with Giemsa/.test(l.what)));
});

test("SAFE-301: one strength only, the other costs 15 and does not count", () => {
  const r = start("safe-301", { strength: "1" });
  r.st.case = "floor";
  say(r, /Stop, don't touch it/); pick(r, "sign", "spillkit", "gloves", "apron", "goggles", "paper");
  const fb = pick(r, "bleach05");
  assert.match(fb[0].msg, /1% \(10,000 ppm\)/); assert.equal(r.st.score, 85);
  assert.equal(view(r).current.id, "contain");
  pick(r, "bleach1"); assert.equal(view(r).current.id, "wait");
});

test("SAFE-301: the contact time and the glass-first order are the lab's", () => {
  const r = start("safe-301", { contact_min: 10, glass_first: true });
  r.st.case = "floor";
  say(r, /Stop, don't touch it/); pick(r, "sign", "spillkit", "gloves", "apron", "goggles");
  pick(r, "paper"); assert.equal(r.st.score, 90);                     // glass first here
  pick(r, "forceps", "sharps", "paper", "bleach05");
  assert.match(view(r).current.choices.find((c) => /Not yet/.test(c.text)).text, /10 minutes/);
  say(r, /Not yet/);
  assert.deepEqual(engine.view(r.st, r.t).steps.length, 7);
  pick(r, "biobag", "bleach1", "sink");
  say(r, /incident form now/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 90);
});
