// ─────────────────────────────────────────────────────────────────────────────
// The 3D practical, run on the server.
//
// The browser draws the bay and sends what the learner did: what they said,
// what they picked up, which label went on which tube. This file decides what
// that meant, keeps the time, and keeps the score. Nothing the browser says
// about a score is ever trusted, because a score the browser keeps is a
// certificate anybody can award themselves.
//
// A run is one plain JSON object (stored in practical_sessions.state), so a
// reload picks up exactly where it was and the full record survives for the
// supervisor.
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS = {
  "phleb-101": require("./scenarios/phleb101"),
  "recep-102": require("./scenarios/recep102"),
  "chem-202": require("./scenarios/chem202"),
  "safe-301": require("./scenarios/safe301"),
  "hema-201": require("./scenarios/hema201"),
  "mal-201": require("./scenarios/mal201"),
  "bb-201": require("./scenarios/bb201"),
};

const list = () => Object.values(SCENARIOS).map((s) => ({ key: s.key, title: s.title, description: s.description }));
const get = (key) => SCENARIOS[key] || null;

// ── The lab's own figures ────────────────────────────────────────────────────
// Each scenario declares the clinical figures a lab may set for itself (a
// critical limit, a disinfectant strength), with a default and the range the
// scenario still makes sense in. A run copies the lab's figures when it starts,
// so a change made in Settings never alters a run already under way, and the
// record keeps what applied.
const settings = (key) => get(key)?.SETTINGS || [];

/**
 * Check figures against a scenario's declarations. Anything missing takes its
 * default; anything out of range is reported, and the default stands in for it.
 * @returns {{ values: object, errors: string[] }}
 */
function cleanSettings(key, input = {}) {
  const values = {}, errors = [];
  for (const f of settings(key)) {
    let v = input?.[f.key];
    if (v === undefined || v === null || v === "") { values[f.key] = f.default; continue; }
    if (f.type === "number") {
      v = Number(v);
      if (!Number.isFinite(v) || v < f.min || v > f.max) { errors.push(`${f.label}: between ${f.min} and ${f.max}${f.unit ? ` ${f.unit}` : ""}.`); values[f.key] = f.default; continue; }
    } else if (f.type === "choice") {
      if (!f.options.some(([o]) => o === v)) { errors.push(`${f.label}: choose one of the options.`); values[f.key] = f.default; continue; }
    } else if (f.type === "bool") v = v === true || v === "true";
    else v = String(v).replace(/\s+/g, " ").trim().slice(0, f.maxLength || 60) || f.default;
    values[f.key] = v;
  }
  return { values, errors };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Everything the engine needs about one run, rebuilt from the stored state.
function ctx(st, now) {
  const sc = get(st.scenario);
  if (!sc) throw new Error(`Unknown practical "${st.scenario}"`);
  const P = sc.PATIENTS.find((p) => p.key === st.patient);
  return { st, sc, P, steps: sc.steps(P, st), now, fb: [] };
}
const secs = (c) => Math.max(0, (c.now - c.st.t0) / 1000);
const stepName = (c) => c.steps[Math.min(c.st.step, c.steps.length - 1)].name;

/**
 * Start a run.
 * @param {string} key          scenario key
 * @param {object} opts
 * @param {number} opts.now     server time in ms
 * @param {number} [opts.patientIndex]  pin a patient (tests); random otherwise
 */
function start(key, { now, patientIndex, cfg } = {}) {
  const sc = get(key);
  if (!sc) throw new Error(`Unknown practical "${key}"`);
  const i = Number.isInteger(patientIndex) ? patientIndex % sc.PATIENTS.length : Math.floor(Math.random() * sc.PATIENTS.length);
  const st = {
    v: 1, scenario: key, patient: sc.PATIENTS[i].key,
    t0: now, step: 0, prog: 0, score: 100, crits: [], deds: [], log: [], seen: [],
    flags: { hands: false, gloves: false, tq: false, tqAt: null, tqDone: false, swabbed: false, needle: false, sharps: false, gauze: false, gone: false },
    drawn: [], labelled: {},
    rack: shuffle(Object.keys(sc.TUBES)),        // nobody learns the tube positions by heart
    choiceOrder: null, picked: null, labels: null, selLabel: null, done: false,
    vars: {}, found: [], used: [], got: [],      // what answers and steps have set; what has been checked; used
    cfg: cleanSettings(key, cfg).values,         // the lab's figures, as they stood when the run began
  };
  sc.init?.(st, sc.PATIENTS[i]);                // a scenario can deal its own starting hand
  enter(ctx(st, now));
  return st;
}

function enter(c) {
  const { st, steps, P } = c, s = steps[st.step];
  st.prog = 0; st.picked = null; st.choiceOrder = null; st.got = [];
  if (s.id === "after" && !st.flags.tq) st.prog = 1;        // tourniquet already released during the draw
  sc_onEnter(c, s);
  if (s.type === "talk") st.choiceOrder = shuffle(s.choices.map((_, i) => i));
  if (s.type === "label") {
    const surnameFirst = P.name.split(" ").reverse().join(", ").replace(/^(\S+)/, (m) => m.toUpperCase());
    st.labels = shuffle([
      ...P.tubes.map((t) => ({ tube: t, name: surnameFirst, dob: P.dob, lab: P.lab, test: P.tubeTest[t] })),
      { ...P.decoy, decoy: true },
    ]).map((l, i) => ({ ...l, id: `L${i + 1}`, used: false }));
  }
}

function sc_onEnter(c, s) { c.sc.onEnter?.(c.st, s); }

function next(c) {
  c.st.step++;
  // Steps can depend on what has happened (the phone call knows what was
  // rejected), so they are rebuilt before the next one starts.
  c.steps = c.sc.steps(c.P, c.st);
  if (c.st.step >= c.steps.length) return finish(c);
  enter(c);
}

function finish(c) {
  c.st.done = true;
  record(c, "Practical finished");
}

function record(c, what, delta = 0, critical = null, note = null) {
  c.st.log.push({ t: Math.round(secs(c) * 10) / 10, step: stepName(c), what, delta, critical, note });
}
const say = (c, kind, msg) => { if (msg) c.fb.push({ kind, msg }); };

// A mistake costs points once per step; repeating it repeats the advice only.
function mistake(c, key, what, delta, note, critical) {
  const { st } = c, k = `${st.step}:${key}`;
  if (st.seen.includes(k)) { say(c, critical ? "crit" : "warn", critical || note); record(c, `${what} (again)`); return; }
  st.seen.push(k);
  st.score = Math.max(0, st.score + delta);
  if (critical) st.crits.push({ step: stepName(c), reason: critical });
  else st.deds.push({ step: stepName(c), delta, note });
  record(c, what, delta, critical, note);
  say(c, critical ? "crit" : "warn", critical || note);
}

const tqLimit = (st, sc) => st.cfg?.tourniquet_limit ?? sc.tourniquetLimit;

// What each action does to the bay, and the line it leaves in the record.
function use(c, id) {
  const { st, sc } = c, f = st.flags;
  switch (id) {
    case "sanitiser": f.hands = true; record(c, "Cleaned hands with alcohol rub"); break;
    case "gloves": f.gloves = true; record(c, "Put on gloves"); break;
    case "tourniquet":
      if (!f.tq) { f.tq = true; f.tqAt = secs(c); record(c, "Applied the tourniquet"); }
      else {
        const on = secs(c) - f.tqAt;
        f.tq = false; f.tqDone = true;
        record(c, c.steps[st.step].id === "after" ? `Released the tourniquet (on ${Math.round(on)} s)` : `Released the tourniquet once blood was flowing (on ${Math.round(on)} s)`);
        const lim = tqLimit(st, sc);
        if (on > lim) mistake(c, "tq-time", `Tourniquet left on ${Math.round(on)} s`, -10,
          `The tourniquet was on for ${Math.round(on)} seconds. Keep it under ${lim % 60 ? `${lim} seconds` : lim === 60 ? "one minute" : `${lim / 60} minutes`}: the blood concentrates and potassium, proteins and cell counts read high.`);
      }
      break;
    case "swab": f.swabbed = true; record(c, "Cleaned the site with an alcohol swab"); break;
    case "needle": f.needle = true; record(c, "Inserted the needle"); break;
    case "sharps": f.needle = false; f.sharps = true; record(c, "Withdrew the needle straight into the sharps bin"); break;
    case "gauze": f.gauze = true; record(c, "Pressed gauze on the site"); break;
    default:
      if (sc.TUBES[id]) st.drawn.push(id);
      else record(c, `Used the ${sc.OBJECTS[id][0].toLowerCase()}`);
  }
}

// Checking: each clue picked up shows what it shows, in any order. Moving on
// with an essential check not made costs what the scenario says it costs.
function check(c, id) {
  const { st, sc, steps } = c, s = steps[st.step], name = sc.OBJECTS[id][0];
  if (s.info?.[id]) return say(c, "info", s.info[id]);
  if (!s.clues.includes(id)) return say(c, "info", sc.NEUTRAL.includes(id) ? `${name}: not needed right now.` : `${name}: not needed to check this result.`);
  st.found ||= [];
  if (st.found.includes(id)) return say(c, "info", "Already checked. What it showed is below the bay.");
  st.found.push(id);
  record(c, `Checked: ${name.toLowerCase()}`);
}
function doneChecking(c) {
  const { st, steps } = c, s = steps[st.step];
  for (const id of s.need) if (!(st.found || []).includes(id)) {
    const m = s.missing?.[id] || { delta: -10, note: `You didn't check the ${c.sc.OBJECTS[id][0].toLowerCase()}.` };
    mistake(c, `missed-${id}`, `Moved on without checking the ${c.sc.OBJECTS[id][0].toLowerCase()}`, m.delta, m.note, m.critical);
  }
  next(c);
}

function pick(c, id) {
  const { st, sc, steps } = c, s = steps[st.step], name = sc.OBJECTS[id][0];
  if (s.type === "talk") return say(c, "info", s.speaker ? "Answer first: choose what you say, below the bay." : "Answer the patient first.");
  if (s.type === "label") return say(c, "info", id === "printer" ? "The labels are printed. Pick one below the bay." : "Pick a label below the bay, then the tube it belongs on.");
  if (s.type === "draw") return drawPick(c, id);
  if (s.type === "check") return check(c, id);
  if (s.type === "inspect") {
    if (st.samples?.some((x) => x.id === id)) return inspect(c, id);
    return say(c, "info", sc.NEUTRAL.includes(id) ? `${name}: not needed right now.` : "Pick up a sample to look at it.");
  }
  if (s.info?.[id]) return say(c, "info", s.info[id]);
  // `alt` lets either of two things do the same job (two strengths that are
  // both right); `any` lets a step's things be used in any order.
  const k = s.alt?.[id] || id, idx = s.need.indexOf(k);
  if (s.any ? (st.got ||= []).includes(k) : idx >= 0 && idx < st.prog) return say(c, "info", "Already done.");
  if (s.any ? idx >= 0 : k === s.need[st.prog]) {
    if (s.any) st.got.push(k);
    if (s.did?.[id]) record(c, s.did[id]); else use(c, id);
    (st.used ||= []).push(k); st.prog++;
    if (st.prog >= s.need.length) {
      if (s.after) record(c, s.after);
      if (s.set) Object.assign(st.vars ||= {}, s.set);
      next(c);
    }
    return;
  }
  if (s.wrong?.[id]) { const w = s.wrong[id]; return mistake(c, id, w.what || `Picked up the ${name.toLowerCase()} too early`, w.delta, w.note, w.critical); }
  if (idx >= 0) {
    const o = s.order?.[k] || { delta: -10, note: `Not yet: the ${name.toLowerCase()} comes later in this step.` };
    return mistake(c, `order-${k}`, `${name}: out of order`, o.delta, o.note);
  }
  if (sc.NEUTRAL.includes(id)) return say(c, "info", `${name}: not needed right now.`);
  mistake(c, `extra-${id}`, `${name} picked up (not needed now)`, -5, `The ${name.toLowerCase()} is not needed at this step.`);
}

function drawPick(c, id) {
  const { st, sc, P } = c, f = st.flags, name = sc.OBJECTS[id][0];
  if (id === "needle") { if (f.needle) return say(c, "info", "The needle is already in the vein."); return use(c, "needle"); }
  if (id === "tourniquet" && f.tq && f.needle) return use(c, "tourniquet");      // releasing once blood flows is good practice
  const T = sc.TUBES[id];
  if (T) {
    if (!f.needle) return mistake(c, "tube-first", "Picked a tube before inserting the needle", -5, "Insert the needle into the vein before you push a tube onto the holder.");
    if (st.drawn.includes(id)) return say(c, "info", "That tube is already full.");
    if (!P.tubes.includes(id)) return mistake(c, `tube-${id}`, `${T.name} tube picked (not ordered)`, -10, `The ${T.name.toLowerCase()} tube (${T.add}) is for ${T.for}. Nothing on this request needs it.`);
    const expect = P.tubes.find((t) => !st.drawn.includes(t));
    if (id !== expect) mistake(c, "order", `Filled ${T.name.toLowerCase()} before ${sc.TUBES[expect].name.toLowerCase()}`, -15, sc.ORDER_WHY[`${expect}>${id}`] || "That breaks the order of draw.");
    else record(c, `Filled the ${T.name.toLowerCase()} tube`);
    use(c, id);
    if (P.tubes.every((t) => st.drawn.includes(t))) next(c);
    return;
  }
  if (sc.NEUTRAL.includes(id)) return say(c, "info", `${name}: not needed right now.`);
  if (id === "cap") return say(c, "info", "Keep the cap off. The needle goes straight into the sharps bin when you finish.");
  mistake(c, `extra-${id}`, `${name} picked up during the draw`, -5, `The ${name.toLowerCase()} is not needed while you draw.`);
}

// Inspecting: pick a sample up to look at it. Deciding: accept it, or reject it
// with a reason. A sample has to be looked at before it can be decided, and a
// decision, once made, stands.
function inspect(c, id) {
  const { st, steps } = c;
  if (steps[st.step].type !== "inspect") throw bad("There is nothing to inspect yet.");
  const S = st.samples.find((x) => x.id === id);
  if (!S) throw bad("There is no such sample.");
  st.selected = id;
  if (!S.inspected) { S.inspected = true; record(c, `Picked up sample ${S.n} (${S.test} for ${S.who.name})`); }
}
function decide(c, id, verdict, reason) {
  const { st, sc, steps } = c;
  if (steps[st.step].type !== "inspect") throw bad("There is nothing to decide yet.");
  const S = st.samples.find((x) => x.id === id);
  if (!S) throw bad("There is no such sample.");
  if (!S.inspected) throw bad("Pick the sample up and look at it first.");
  if (S.decision) throw bad("That sample has already been decided.");
  if (verdict !== "accept" && verdict !== "reject") throw bad("Accept or reject?");
  if (verdict === "reject" && !sc.REASONS.includes(reason)) throw bad("Choose a reason for rejecting it.");
  S.decision = verdict === "accept" ? { verdict } : { verdict, reason };
  const j = sc.judge(S, verdict, reason);
  if (j) mistake(c, `decide-${id}`, j.what, j.delta, j.note || null, j.critical || null);
  else record(c, verdict === "accept" ? `Accepted sample ${S.n} (${S.test})` : `Rejected sample ${S.n} (${S.test}): ${reason}`);
  if (st.selected === id) st.selected = null;
  if (st.samples.every((x) => x.decision)) next(c);
}

function choose(c, choiceId) {
  const { st, steps } = c, s = steps[st.step];
  if (s.type !== "talk" || st.picked != null) throw bad("Nothing to answer right now.");
  if (!st.choiceOrder.includes(choiceId)) throw bad("That answer is not on offer.");
  const ch = s.choices[choiceId];
  st.picked = choiceId;
  if (ch.critical || ch.delta) mistake(c, "say", `Said: "${ch.text}"`, ch.delta || -30, ch.note || null, ch.critical || null);
  else record(c, `Said: "${ch.text}"`);
  if (ch.leaves) st.flags.gone = true;
  if (ch.set) Object.assign(st.vars ||= {}, ch.set);
}

// Continue after an answer. Some answers only send you back to think again:
// the same question, without that answer.
function carryOn(c) {
  const { st, steps } = c, s = steps[st.step];
  if (s.type === "check") return doneChecking(c);
  if (s.type !== "talk" || st.picked == null) throw bad("Answer the patient first.");
  if (s.choices[st.picked].again) {
    st.choiceOrder = st.choiceOrder.filter((i) => i !== st.picked);
    st.picked = null;
    return;
  }
  next(c);
}

function applyLabel(c, labelId, tube) {
  const { st, sc, P, steps } = c;
  if (steps[st.step].type !== "label") throw bad("There is nothing to label yet.");
  const L = st.labels.find((l) => l.id === labelId);
  if (!L || L.used) throw bad("That label is not available.");
  if (!P.tubes.includes(tube) || st.labelled[tube]) throw bad("That tube cannot take a label.");
  if (L.decoy) {
    L.used = true;
    return mistake(c, "decoy", `Picked up the label for ${L.name} (${L.dob})`, -30, null,
      `That label belongs to a different patient: ${L.name}, born ${L.dob}. Look-alike names are how wrong-blood-in-tube errors happen. Check the name, date of birth and lab number every time.`);
  }
  if (L.tube !== tube) return mistake(c, `swap-${tube}`, `Put the ${L.test} label on the ${sc.TUBES[tube].name.toLowerCase()} tube`, -10,
    `That label is for the ${L.test} (${sc.TUBES[L.tube].name.toLowerCase()} tube). The lab would run the wrong test on the wrong sample.`);
  L.used = true; st.labelled[tube] = true;
  record(c, `Labelled the ${sc.TUBES[tube].name.toLowerCase()} tube (${L.test}) ${st.flags.gone ? "after the patient had gone" : "at the chair"}`);
  if (P.tubes.every((t) => st.labelled[t])) next(c);
}

function bad(message) { const e = new Error(message); e.status = 400; return e; }

/**
 * Apply one action to a run. Mutates `st`.
 * Actions: { type: "say", choice } · { type: "continue" } · { type: "pick", id } · { type: "label", label, tube }
 * @returns {{ kind: "info"|"warn"|"crit", msg: string }[]}  what to tell the learner
 */
function act(st, action, now) {
  if (st.done) throw bad("This practical is already finished.");
  const c = ctx(st, now), a = action || {};
  switch (a.type) {
    case "say": choose(c, Number(a.choice)); break;
    case "continue": carryOn(c); break;
    case "pick":
      if (!c.sc.OBJECTS[a.id]) throw bad("There is no such thing in the bay.");
      pick(c, a.id); break;
    case "label": applyLabel(c, String(a.label), String(a.tube)); break;
    case "inspect": inspect(c, String(a.sample)); break;
    case "decide": decide(c, String(a.sample), a.verdict, a.reason); break;
    default: throw bad("Unknown action.");
  }
  st.last = now;
  return c.fb;
}

/**
 * The grade, once a run is done. The rules belong to the course, not the
 * scenario: how much of the final mark the practical carries, the final pass
 * mark, and the practical's own minimum.
 *
 *   final = theory × (100 − weight)% + practical × weight%
 *
 * A course with no quiz certifies on the practical alone. A critical safety
 * error fails it whatever the numbers.
 * @param {object} st      the run
 * @param {object} rules   { weight, finalPass, practicalMin, theory }  theory = best quiz score, or null for no quiz
 */
function grade(st, { weight = 70, finalPass = 80, practicalMin = 0, theory = null } = {}) {
  const practical = st.score, critical = st.crits.length > 0;
  const w = theory == null ? 100 : Math.min(100, Math.max(0, weight));
  const final = Math.round(((theory ?? 0) * (100 - w) + practical * w) / 100);
  const reasons = [];
  if (critical) reasons.push("critical");
  if (final < finalPass) reasons.push("final");
  if (practicalMin > 0 && practical < practicalMin) reasons.push("practical");
  return {
    score: practical, practical, theory, weight: w, final, finalPass, practicalMin,
    critical, passed: st.done && reasons.length === 0, reasons,
  };
}

/**
 * What the browser may see of a run: enough to draw the bay and the panels,
 * never the answers. Choices come without their costs, and the decoy label is
 * just another label.
 */
function view(st, now) {
  const c = ctx(st, now), { sc, P, steps } = c, s = st.done ? null : steps[st.step];
  const f = st.flags;
  return {
    scenario: { key: sc.key, title: sc.title, bay: sc.bay },
    patient: {
      name: P.name, sex: P.sex, female: P.female, dob: P.dob, age: P.age, lab: P.lab, clinic: P.clinic, doctor: P.doctor,
      time: P.time, tests: P.tests, ticks: P.ticks, notes: P.notes, look: P.look, tubes: P.tubes || [], ward: P.ward,
      formTests: sc.FORM_TESTS || null,
    },
    tubes: Object.fromEntries(Object.entries(sc.TUBES).map(([k, t]) => [k, { name: t.name, add: t.add, cap: t.cap, short: t.short }])),
    objects: sc.objects ? sc.objects(st) : sc.OBJECTS,
    steps: steps.map((x) => x.name),
    step: st.step,
    current: s && {
      id: s.id, name: s.name, type: s.type, view: s.view, task: s.task || null,
      speaker: s.speaker || null, anchor: s.anchor || null,
      // Some checks are not things in the room (where to look on a slide): they
      // are offered as buttons. Which of them matter is never said.
      doneText: s.doneText || null,
      clues: s.type === "check" && s.buttons ? s.clues.map((id) => ({ id, name: sc.OBJECTS[id][0] })) : null,
      // Once the patient has left, nobody is there to speak, unless the step is
      // with someone else, such as the ward on the phone.
      say: s.type === "talk" && !(f.gone && st.picked == null && !s.anchor) ? s.say : null,
      choices: s.type === "talk" && st.picked == null ? st.choiceOrder.map((i) => ({ id: i, text: s.choices[i].text })) : null,
      picked: s.type === "talk" && st.picked != null
        ? { text: s.choices[st.picked].text, reply: s.choices[st.picked].reply, leaves: !!s.choices[st.picked].leaves } : null,
    },
    labels: s?.type === "label" ? st.labels.map(({ id, name, dob, lab, tube, test, used }) => ({ id, name, dob, lab, tube, short: sc.TUBES[tube].short, test, used })) : null,
    flags: { hands: f.hands, gloves: f.gloves, tq: f.tq, tqDone: f.tqDone, swabbed: f.swabbed, needle: f.needle, sharps: f.sharps, gauze: f.gauze, gone: f.gone },
    tq_elapsed: f.tq ? Math.max(0, secs(c) - f.tqAt) : null,
    tq_limit: tqLimit(st, sc),
    drawn: st.drawn, labelled: st.labelled, rack: st.rack,
    samples: st.samples ? st.samples.map((x) => sc.sampleView(x, P)) : null,
    selected: st.selected || null, reasons: sc.REASONS || null,
    // Checking: only what has been checked is shown, never what is still to find.
    findings: sc.findings ? sc.findings(st, P) : null,
    specimen: sc.specimen ? sc.specimen(st) : null,
    elapsed: secs(c), done: st.done,
  };
}

/** The full record, for the result screen and the supervisor. */
function summary(st) {
  return { score: st.score, crits: st.crits, deds: st.deds, log: st.log, patient: st.patient };
}

/** One line saying what a run was about, for lists: the patient and tests, or the batch of samples. */
function subject(st) {
  const sc = get(st.scenario), P = sc?.PATIENTS.find((p) => p.key === st.patient);
  if (!P) return st.patient;
  if (sc.subject) return sc.subject(st, P);
  if (st.samples) return `${st.samples.length} samples from ${P.ward} (${P.name})`;
  return `${P.name} · ${P.tests.join(" + ")}`;
}

module.exports = { list, get, start, act, view, grade, summary, subject, settings, cleanSettings };
