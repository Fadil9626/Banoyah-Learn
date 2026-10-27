// RECEP-102 — sample reception and rejection, as a 3D practical.
//
// A ward nurse hands five samples over the reception counter. Each one has to
// be picked up, looked at, and checked against its request form, then accepted
// or rejected with the reason ELIMS records. The faults are dealt at random
// every run — always at least one label problem, because that is the one that
// hurts patients — so nobody can learn the answers instead of the job.
const TUBES = require("./tubes");

// Exactly as ELIMS lists them at sample reception, so the practical teaches the
// words staff pick from at work.
const REASONS = [
  "Hemolyzed Sample",
  "Clotted Sample",
  "Insufficient Volume (QNS)",
  "Mislabeled / Unlabeled Tube",
  "Wrong Tube Type Drawn",
  "Leaked / Damaged in Transit",
  "Temperature Excursion (Too Warm/Cold)",
];

const PEOPLE = [
  { name: "Fatmata Conteh", dob: "11/03/1964", alt: "11/03/1946", sex: "Female" },
  { name: "Mohamed Bangura", dob: "27/08/1958", alt: "27/08/1985", sex: "Male" },
  { name: "Isata Kamara", dob: "05/12/1989", alt: "12/05/1989", sex: "Female" },
  { name: "Abdul Sesay", dob: "19/01/1975", alt: "19/01/1957", sex: "Male" },
  { name: "Hawa Turay", dob: "30/06/1992", alt: "03/06/1992", sex: "Female" },
  { name: "Sorie Koroma", dob: "14/02/1950", alt: "14/02/1959", sex: "Male" },
  { name: "Aminata Jalloh", dob: "08/09/1981", alt: "09/08/1981", sex: "Female" },
  { name: "Alhaji Kanu", dob: "23/04/1967", alt: "23/04/1976", sex: "Male" },
];

const TESTS = {
  "FBC":       { tube: "edta",     notes: "?Anaemia. Tired, pale." },
  "U&E":       { tube: "sst",      notes: "AKI on an ACE inhibitor. Please check K+." },
  "LFT":       { tube: "sst",      notes: "Jaundice for 1 week." },
  "PT/INR":    { tube: "citrate",  notes: "On warfarin 5 mg. INR please." },
  "FBG":       { tube: "fluoride", notes: "Fasting glucose. Known diabetic." },
};

// What is wrong with a sample, which tests it can happen to, the reason to
// record, what accepting it would cost, and why.
const DEFECTS = {
  haemolysed:  { tests: ["U&E", "LFT"], reason: "Hemolyzed Sample", delta: -20,
    why: "Haemolysis releases potassium from the red cells: the potassium reads falsely high, sometimes high enough to trigger a false critical call." },
  clotted:     { tests: ["FBC", "PT/INR"], reason: "Clotted Sample", delta: -20,
    why: "A clot traps cells and platelets, so counts read falsely low, and a clotted citrate sample cannot give a valid PT." },
  underfilled: { tests: ["PT/INR"], reason: "Insufficient Volume (QNS)", delta: -20,
    why: "Citrate tubes need the 9:1 blood-to-anticoagulant ratio. Under-filled, the extra citrate makes the PT falsely long." },
  wrongtube:   { tests: ["U&E", "FBG"], reason: "Wrong Tube Type Drawn", delta: -20,
    why: null },     // depends on the test; see wrongTubeWhy
  leaked:      { tests: Object.keys(TESTS), reason: "Leaked / Damaged in Transit", delta: -15,
    why: "A leaking tube is a biohazard, and the sample may be contaminated or short. Reject it and bag it for disposal." },
  mismatch:    { tests: Object.keys(TESTS), reason: "Mislabeled / Unlabeled Tube", critical: true,
    why: "The label and the form disagree on the date of birth: this could be another patient's blood. It has to be recollected, never relabelled." },
  unlabelled:  { tests: Object.keys(TESTS), reason: "Mislabeled / Unlabeled Tube", critical: true,
    why: "An unlabelled tube cannot be matched to anybody. It has to be recollected." },
};
const WRONG_TUBE = { "U&E": "edta", "FBG": "sst" };
const wrongTubeWhy = (test) => test === "U&E"
  ? "U&E in a purple EDTA tube: EDTA is a potassium salt and binds calcium, so potassium reads falsely high and calcium falsely low."
  : "Glucose in a gold tube: with no fluoride, the cells keep using the glucose and the result falls by 5–7% an hour.";
const whyOf = (s) => s.defect === "wrongtube" ? wrongTubeWhy(s.test) : DEFECTS[s.defect].why;

const OBJECTS = {
  phone: ["Phone", "Ward extensions are on the list beside it"],
  monitor: ["ELIMS terminal", "Sample reception"],
  bag: ["Specimen transport bag", ""],
};
for (let i = 1; i <= 5; i++) OBJECTS[`s${i}`] = [`Sample ${i}`, "Pick it up to look at it"];
const NEUTRAL = ["phone", "monitor", "bag"];

// The nurses who might bring the samples down.
const PATIENTS = [
  { key: "musu", name: "Musu Kamara", title: "Nurse Kamara", female: true, ward: "Medical ward", sister: "Sister Bangura",
    look: { skin: "#5f3b24", shirt: "#3c6e9e", trousers: "#3c6e9e", hair: "headtie", nurse: true } },
  { key: "tamba", name: "Tamba Sesay", title: "Nurse Sesay", female: false, ward: "Surgical ward", sister: "Sister Koroma",
    look: { skin: "#6b4429", shirt: "#2f7d6d", trousers: "#2f7d6d", hair: "short", nurse: true } },
];

function shuffle(arr, rnd = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pickOne = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];

// Deal the five samples for a run: one label problem, two other faults, two good.
function init(st, P, rnd = Math.random) {
  const faults = [pickOne(["mismatch", "unlabelled"], rnd), ...shuffle(["haemolysed", "clotted", "underfilled", "wrongtube", "leaked"], rnd).slice(0, 2)];
  const deal = shuffle([...faults, null, null], rnd);
  const people = shuffle(PEOPLE, rnd);
  const urgent = new Set(shuffle([0, 1, 2, 3, 4], rnd).slice(0, 2));
  const base = 1400 + Math.floor(rnd() * 400);
  st.samples = deal.map((defect, i) => {
    const test = defect ? pickOne(DEFECTS[defect].tests, rnd) : pickOne(Object.keys(TESTS), rnd);
    const who = people[i], lab = `LAB-2026-${base + i}`;
    const tube = defect === "wrongtube" ? WRONG_TUBE[test] : TESTS[test].tube;
    const label = defect === "unlabelled" ? null
      : { name: who.name, dob: defect === "mismatch" ? who.alt : who.dob, lab, test };
    return { id: `s${i + 1}`, n: i + 1, who, lab, test, tube, defect, urgent: urgent.has(i), label, inspected: false, decision: null };
  });
  st.ward = P.ward;
}

// How a tube looks, as numbers and colours for the 3D view. Heights are
// fractions of the tube; serum tubes arrive spun, so the layers show.
function look(s) {
  const T = TUBES[s.tube], fill = s.defect === "underfilled" ? 0.5 : 0.88;
  const layers = T.blood === "serum"
    ? [[0, 0.42, "#5a0c10"], ...(T.gel ? [[0.42, 0.48, "#ece6c8"]] : []), [T.gel ? 0.48 : 0.42, fill, s.defect === "haemolysed" ? "#b8342c" : "#e3b94f"]]
    : [[0, fill, "#5a0c10"]];
  return { fill, layers, clot: s.defect === "clotted", smear: s.defect === "leaked", capTilt: s.defect === "leaked", labelled: !!s.label, fillLine: s.tube === "citrate" ? 0.88 : null };
}

function sampleView(s, P) {
  const T = TUBES[s.tube];
  return {
    id: s.id, n: s.n, urgent: s.urgent, tube: s.tube, tubeName: T.name, cap: T.cap,
    form: { name: s.who.name, dob: s.who.dob, sex: s.who.sex, lab: s.lab, ward: P.ward, doctor: "Dr S. Kargbo", ticks: [s.test], notes: TESTS[s.test].notes, test: s.test },
    label: s.label, look: look(s), inspected: s.inspected, decision: s.decision,
  };
}

/**
 * Judge one decision. Returns null when it was right, or what it cost.
 */
function judge(s, verdict, reason) {
  if (!s.defect) {
    if (verdict === "accept") return null;
    return { what: `Rejected sample ${s.n} (${s.test} for ${s.who.name}), which was fine`, delta: -10,
      note: `Sample ${s.n} was fine. Rejecting it means ${s.who.name} has a needle again for nothing, and the result is delayed.` };
  }
  const D = DEFECTS[s.defect];
  if (verdict === "accept") {
    return D.critical
      ? { what: `Accepted sample ${s.n} with a label problem`, delta: -30, critical: `Sample ${s.n}: ${whyOf(s)}` }
      : { what: `Accepted sample ${s.n} (${s.test}), which should have been rejected`, delta: D.delta, note: `Sample ${s.n} should have been rejected (${D.reason}). ${whyOf(s)}` };
  }
  if (reason !== D.reason) return { what: `Rejected sample ${s.n} as "${reason}"`, delta: -5,
    note: `Right to reject sample ${s.n}, but the reason should be "${D.reason}". The ward needs the real reason to fix the problem. ${whyOf(s)}` };
  return null;
}

// The phone call: what you can say depends on what you rejected.
function callChoices(st) {
  const rejected = (st.samples || []).filter((s) => s.decision?.verdict === "reject");
  const labelIssue = rejected.some((s) => s.defect === "mismatch" || s.defect === "unlabelled");
  if (!rejected.length) return [
    { text: `This is the lab. All five samples arrived and were accepted. The two urgent ones are on the analyser now.`, reply: "Thank you, that's good to hear." },
    { text: "Everything's fine. Bye.", reply: "Oh... alright.", delta: -5, note: "Tell the ward which urgent samples are running, so they know when to expect results." },
  ];
  const list = rejected.map((s) => `${s.who.name} (${s.test}): ${s.decision.reason}`).join("; ");
  const choices = [
    { text: `This is the lab. ${rejected.length} of your samples can't be processed: ${list}. Please recollect them. I've recorded the reasons in ELIMS.`, reply: "Thank you for letting us know. We'll recollect them now." },
    { text: "Your ward keeps sending us rubbish samples. Do them again.", reply: "There's no need to speak to us like that.", delta: -10,
      note: "Be specific and courteous: say which samples, why, and what you need. The ward has to fix it, not feel blamed." },
    { text: "I'll just mark them rejected in ELIMS. They'll see it eventually.", reply: "(You hang up without calling.)", delta: -15,
      note: "Phone the ward. Urgent samples were waiting, and the patients need recollecting quickly." },
  ];
  if (labelIssue) choices.push({
    text: "One of the labels is wrong. Send someone down to correct it and we'll run it.", reply: "Alright, I'll send a nurse down with a pen.",
    delta: -30, critical: "Never relabel a mislabelled or unlabelled sample. Nobody can prove whose blood is in that tube. It has to be recollected from the patient.",
  });
  return choices;
}

function steps(P, st = {}) {
  const urgent = (st.samples || []).filter((s) => s.urgent).length || 2;
  return [
    { id: "handover", name: "Handover", type: "talk", view: "nurse",
      say: `Five samples from ${P.ward}. ${urgent} of them are urgent for the consultant's round. Can you sign for them?`, choices: [
      { text: "I'll check each sample against its form first, then sign for the ones I can accept.", reply: "Of course. I'll wait." },
      { text: "Sure, I'll sign for all five now.", reply: "Great, thanks.", delta: -15,
        note: "Signing before checking makes the lab responsible for samples it may have to reject. Check first, then sign." },
      { text: "Just leave them on the counter, I'll look later.", reply: "Oh. Alright then.", delta: -10,
        note: "Check urgent samples at handover, while the nurse is still here to answer questions." },
    ] },
    { id: "check", name: "Check samples", type: "inspect", view: "counter",
      task: "Pick up each sample, compare its label with its request form, and look closely at the tube. Then accept it, or reject it with a reason." },
    { id: "call", name: "Call the ward", type: "talk", view: "phone", speaker: `${P.sister} (${P.ward}, on the phone)`, anchor: "phone",
      say: `${P.ward}, ${P.sister} speaking.`, choices: callChoices(st) },
  ];
}

// The nurse goes back to the ward once the samples are checked.
function onEnter(st, s) { if (s.id === "call") st.flags.gone = true; }

module.exports = {
  key: "recep-102",
  title: "RECEP-102 · Sample reception and rejection",
  description: "Reception counter: a ward nurse hands over five samples. Check each against its form, accept or reject with the ELIMS reason, and call the ward. Faults change every run.",
  bay: "reception",
  tourniquetLimit: 60,
  TUBES, OBJECTS, NEUTRAL, PATIENTS, REASONS, DEFECTS, ORDER_WHY: {},
  steps, init, onEnter, judge, sampleView,
};
