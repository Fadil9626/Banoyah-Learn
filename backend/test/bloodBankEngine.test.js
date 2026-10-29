// BB-201's rules: group the sample and check it against the record; crossmatch
// units of her group; issue only when the slip, the label and the request agree.
// The case and the group are dealt at random, so each test pins them.
const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../lib/practical/engine");

const run = (kase, group = "B RhD positive") => {
  const st = engine.start("bb-201", { now: 0, patientIndex: 0 });
  st.case = kase; st.vars.group = group; if (kase !== "wbit") st.vars.history = "A RhD positive";
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
const toDecide = (r) => { say(r, /group and crossmatch as soon/); pick(r, "tube", "tile", "terminal"); act(r, { type: "continue" }); };
const toIssue = (r) => { pick(r, "fridge", "gelcard", "centrifuge", "slip", "label", "request"); act(r, { type: "continue" }); };

test("clean: group, crossmatch, check and hand over with the register: 100", () => {
  const r = run("clean"); toDecide(r); say(r, /^B RhD positive:/); toIssue(r); say(r, /Everything matches/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 100);
});

test("the tile shows the group's pattern, and the record agrees except in the wrong-blood case", () => {
  let r = run("clean", "O RhD negative"); toDecide(r);
  const tile = view(r).findings.find((f) => f.id === "tile");
  assert.deepEqual(tile.wells.map((w) => w.agg), [false, false, false, true, true]);
  assert.equal(view(r).findings.find((f) => f.id === "terminal").rows[0][1], "O RhD negative");
  r = run("wbit", "A RhD positive"); r.st.vars.history = "B RhD positive"; toDecide(r);
  assert.equal(view(r).findings.find((f) => f.id === "terminal").rows[0][1], "B RhD positive");
});

test("wrong blood in tube: stopping and asking for a bedside sample passes; crossmatching it is critical", () => {
  let r = run("wbit"); toDecide(r); say(r, /Don't crossmatch/); say(r, /This is the blood bank/);
  assert.equal(r.st.done, true); assert.equal(r.st.score, 100);
  r = run("wbit"); toDecide(r); say(r, /^B RhD positive:/); assert.match(r.st.crits[0].reason, /wrong blood in tube/);
  r = run("wbit"); toDecide(r); say(r, /Don't crossmatch/); say(r, /relabel/); assert.match(r.st.crits[0].reason, /Never relabel/);
});

test("reading the wrong group is critical", () => {
  const r = run("clean"); toDecide(r); say(r, /^AB RhD positive:/);
  assert.equal(r.st.crits.length, 1); assert.match(r.st.crits[0].reason, /tile read B RhD positive/);
});

test("the wrong patient's slip: refusing passes; handing over is critical; the slip shows the other patient", () => {
  let r = run("slip"); toDecide(r); say(r, /^B RhD positive:/); toIssue(r);
  assert.match(view(r).findings.find((f) => f.id === "slip").lines[0], /27\/12\/1975/);
  say(r, /Don't take it/); assert.equal(r.st.score, 100); assert.equal(r.st.done, true);
  r = run("slip"); toDecide(r); say(r, /^B RhD positive:/); toIssue(r); say(r, /Everything matches/);
  assert.match(r.st.crits[0].reason, /Same name, different patient/);
});

test("not checking the slip at issue is critical", () => {
  const r = run("clean"); toDecide(r); say(r, /^B RhD positive:/);
  pick(r, "fridge", "gelcard", "centrifuge", "label", "request"); act(r, { type: "continue" });
  assert.match(r.st.crits[0].reason, /collection slip/);
});

test("the issue time is the lab's", () => {
  const st = engine.start("bb-201", { now: 0, patientIndex: 0, cfg: { issue_minutes: 20 } }); st.case = "clean"; st.vars.group = "B RhD positive"; st.vars.history = "B RhD positive";
  const r = { st, t: 0 }; toDecide(r); say(r, /^B RhD positive:/); toIssue(r);
  assert.match(view(r).current.choices.find((c) => /Everything matches/.test(c.text)).text, /within 20 minutes/);
});
