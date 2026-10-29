// BB-201 — the blood bank: the right blood to the right patient.
//
// The ward phones for two units for a woman bleeding after delivery. The learner
// checks the sample against the request, reads the grouping tile (forward and
// reverse grouping), checks the group on record in ELIMS, crossmatches units of
// her group, and issues them to the porter only when the collection slip, the
// unit's compatibility label and the request all agree.
//
// The patient's group is dealt at random, so the tile has to be read, not
// remembered. What goes wrong is dealt at random too:
//   clean    everything agrees: issue, and sign the register with the porter.
//   wbit     today's group isn't the group on record: wrong blood in tube. Don't
//            crossmatch; ask for a fresh bedside-labelled sample, offer O negative.
//   slip     the porter's slip is for another patient with the same name. Don't
//            issue.
//
// A lab sets its own emergency group policy and the time allowed from issue to
// the start of the transfusion in Settings › Practicals.

const COLLEAGUE = "Mr Kallon (senior scientist)";
const PORTER = "Mr Koroma (porter)";

const OBJECTS = {
  tube: ["The sample", "EDTA (pink), group and crossmatch"],
  tile: ["Grouping tile", "Forward and reverse grouping"],
  terminal: ["ELIMS terminal", "Blood group on record"],
  fridge: ["Blood bank fridge", "Units by group, 2–6 °C"],
  gelcard: ["Gel cards", "For the crossmatch"],
  centrifuge: ["Gel card centrifuge", ""],
  phone: ["Phone", ""], register: ["Issue register", "Signed by whoever hands over and whoever collects"],
  // what is checked at issue: offered as buttons
  slip: ["Collection slip", "What the porter has brought"],
  label: ["Compatibility label", "On the unit"],
  request: ["Request form", "What the ward asked for"],
};
const NEUTRAL = ["phone", "register"];

// Blood groups and how they read on the tile: anti-A, anti-B, anti-D (forward,
// the patient's cells) and A cells, B cells (reverse, the patient's plasma).
const GROUPS = {
  "A RhD positive": [1, 0, 1, 0, 1], "B RhD positive": [0, 1, 1, 1, 0], "O RhD positive": [0, 0, 1, 1, 1],
  "AB RhD positive": [1, 1, 1, 0, 0], "O RhD negative": [0, 0, 0, 1, 1], "A RhD negative": [1, 0, 0, 0, 1],
};
const short = (g) => g.replace(" RhD positive", " pos").replace(" RhD negative", " neg");

const LOOK = { skin: "#3f2617", shirt: "#3a6ea5", trousers: "#2c3e50", hair: "short" };
const PATIENTS = [
  { key: "mariama", name: "Mariama Sesay", female: true, sex: "Female", dob: "11/03/1998", age: 28, lab: "LAB-2026-2455", hosp: "H-104882",
    ward: "Maternity ward", clinic: "Maternity ward", doctor: "Dr K. Bangura", sister: "Midwife Kamara", time: "02:15",
    tests: ["Group and crossmatch, 2 units"], ticks: ["Group & crossmatch"], notes: "PPH after delivery, estimated loss 1.2 L. Hb 7.1. Crossmatch 2 units, urgent.", look: LOOK },
  { key: "fatu", name: "Fatu Koroma", female: true, sex: "Female", dob: "05/09/1993", age: 33, lab: "LAB-2026-2471", hosp: "H-098317",
    ward: "Maternity ward", clinic: "Maternity ward", doctor: "Dr K. Bangura", sister: "Midwife Conteh", time: "04:40",
    tests: ["Group and crossmatch, 2 units"], ticks: ["Group & crossmatch"], notes: "Retained placenta, bleeding. Hb 6.8. Crossmatch 2 units, urgent.", look: LOOK },
];
const FORM_TESTS = ["Group & crossmatch", "Group & save", "FBC", "Coombs (DAT)", "Antibody screen", "Sickling", "PT/INR", "APTT", "Malaria film", "HIV", "HBsAg", "Syphilis"];
// Someone else with the same name, for the wrong-patient slip.
const NAMESAKE = { mariama: { dob: "27/12/1975", hosp: "H-071290", ward: "Surgical ward" }, fatu: { dob: "18/01/1961", hosp: "H-052114", ward: "Medical ward" } };

const SETTINGS = [
  { key: "emergency", label: "Emergency (uncrossmatched) blood", type: "choice", default: "oneg",
    options: [["oneg", "O RhD negative for everyone"], ["opos", "O RhD negative for girls and women under 50; O RhD positive for everyone else"]],
    help: "Offered to the ward when a patient can't wait. The patients in this practical are women of childbearing age, so either policy gives O negative here." },
  { key: "issue_minutes", label: "Time allowed from issue to the start of the transfusion", type: "number", unit: "minutes", default: 30, min: 15, max: 60, step: 5 },
];
const DEFAULTS = Object.fromEntries(SETTINGS.map((f) => [f.key, f.default]));
const cf = (st) => ({ ...DEFAULTS, ...(st.cfg || {}) });

function init(st, P, rnd = Math.random) {
  const cases = ["clean", "wbit", "slip"], groups = Object.keys(GROUPS);
  st.case = cases[Math.floor(rnd() * cases.length)];
  const group = groups[Math.floor(rnd() * groups.length)];
  const others = groups.filter((g) => g !== group);
  st.vars = { group, history: others[Math.floor(rnd() * others.length)], unit: `G0${Math.floor(10000 + rnd() * 89999)}` };
  st.found = [];
}

const fmtSample = (P) => `${P.name.split(" ").reverse().join(", ").replace(/^(\S+)/, (m) => m.toUpperCase())} · DOB ${P.dob} · ${P.hosp} · ${P.lab}`;

function findings(st, P) {
  const v = st.vars, out = [], wells = GROUPS[v.group];
  const ns = NAMESAKE[P.key], slipWho = st.case === "slip" ? { dob: ns.dob, hosp: ns.hosp, ward: ns.ward } : { dob: P.dob, hosp: P.hosp, ward: P.ward };
  for (const id of st.found || []) {
    if (id === "tube") out.push({ id, type: "text", title: "The sample", lines: [`Label: ${fmtSample(P)}`, "Hand-written at the bedside, signed by the midwife, dated today. It matches the request form."] });
    if (id === "tile") out.push({ id, type: "tile", title: "Grouping tile (today's sample)", wells: ["Anti-A", "Anti-B", "Anti-D", "A cells", "B cells"].map((name, i) => ({ name, agg: !!wells[i], seed: i * 7 + v.unit.length })),
      note: "Forward grouping: the patient's red cells against anti-A, anti-B and anti-D. Reverse grouping: the patient's plasma against A and B cells. Clumps mean a reaction." });
    if (id === "terminal") out.push({ id, type: "table", title: `ELIMS: blood group on record for ${P.name}`, head: ["When", "Group", "Antibody screen"],
      rows: st.case === "wbit" ? [["14 months ago (antenatal)", v.history, "Negative"]] : [["14 months ago (antenatal)", v.group, "Negative"]] });
    if (id === "slip") out.push({ id, type: "text", title: "Collection slip (brought by the porter)", lines: [`${P.name} · DOB ${slipWho.dob} · ${slipWho.hosp}`, `${slipWho.ward} · 2 units`] });
    if (id === "label") out.push({ id, type: "text", title: `Compatibility label on unit ${v.unit}`, lines: [`${P.name} · DOB ${P.dob} · ${P.hosp} · ${P.ward}`, `Patient ${short(v.group)} · Unit ${short(v.group)} · Crossmatch compatible · Expires in 21 days`] });
    if (id === "request") out.push({ id, type: "text", title: "Request form", lines: [`${P.name} · DOB ${P.dob} · ${P.hosp} · ${P.ward}`, "Group and crossmatch, 2 units, urgent"] });
  }
  return out;
}

function specimen(st) { return { used: st.used || [], group: st.vars?.decided ? st.vars.group : null }; }

// The groups offered when deciding: the true one, and the two it is most
// easily mistaken for.
const NEAR = { "A RhD positive": ["AB RhD positive", "O RhD positive"], "B RhD positive": ["AB RhD positive", "O RhD positive"], "O RhD positive": ["A RhD positive", "O RhD negative"],
  "AB RhD positive": ["A RhD positive", "B RhD positive"], "O RhD negative": ["O RhD positive", "A RhD negative"], "A RhD negative": ["A RhD positive", "O RhD negative"] };

function decideChoices(st) {
  const v = st.vars, wbit = st.case === "wbit";
  const groupChoice = (g) => ({ text: `${g}: forward and reverse agree. Crossmatch two ${short(g)} units.`, reply: "Go on, then.", set: { decision: "group", decided: true } });
  const truth = groupChoice(v.group), [d1, d2] = NEAR[v.group].map(groupChoice);
  const stop = { text: "Don't crossmatch: today's group isn't the group on record. The sample may be from someone else. Ask for a new sample, and offer emergency units if she can't wait.", reply: "Good catch. Call the ward.", set: { decision: "wbit" } };
  for (const d of [d1, d2]) Object.assign(d, { delta: -30, critical: `The tile read ${v.group}: ${d.text.split(":")[0]} is wrong. Read every well, forward and reverse, and check they agree. ABO-incompatible blood can kill.` });
  if (wbit) {
    Object.assign(truth, { delta: -30, critical: `Today's sample groups as ${v.group}, but ELIMS has her as ${v.history}. One of the two samples is from someone else: wrong blood in tube. Crossmatching it could give her blood of the wrong group.` });
  } else {
    Object.assign(stop, { delta: -15, note: `Today's group matches the group on record (${v.group}). Asking for a new sample delays blood for a bleeding woman.` });
  }
  return [truth, d1, d2, stop];
}

function steps(P, st = {}) {
  const v = st.vars || {}, g = cf(st), wbit = st.case === "wbit", slipCase = st.case === "slip";
  // Emergency blood by the lab's policy: O negative for girls and women who may
  // yet have children, and, under the second policy, O positive for everyone else.
  const emergency = g.emergency === "opos" && !(P.female && P.age < 50) ? "O RhD positive" : "O RhD negative";
  const list = [
    { id: "request", name: "The request", type: "talk", view: "phone", anchor: "phone", speaker: `${P.sister} (${P.ward}, on the phone)`,
      say: `${P.ward}. ${P.name} is bleeding after delivery and we need two units. Her sample's on its way down. How long?`, choices: [
        { text: `We'll group and crossmatch as soon as the sample's here: about 45 minutes. If she can't wait that long, ${emergency} emergency units are in the fridge: the doctor signs for them.`, reply: "Thank you. I'll tell the doctor." },
        { text: "Just tell me her group and I'll send group-specific blood straight away.", reply: "I... think she's A?", delta: -30,
          critical: "Never issue blood on a group someone remembers. Group her sample here. If she can't wait, give O negative emergency units." },
        { text: "We're busy with routine work. Maybe two hours.", reply: "Two hours?!", delta: -20, note: "A bleeding patient comes first. Crossmatch now, and offer emergency units if she can't wait." },
      ] },
    { id: "group", name: "Group the sample", type: "check", view: "bench", doneText: "I've checked: decide",
      task: "Check the sample's label against the request, read the grouping tile (forward and reverse), and check her group on record in ELIMS.",
      clues: ["tube", "tile", "terminal"], need: ["tube", "tile", "terminal"],
      missing: {
        tube: { delta: -10, note: "You didn't check the sample's label against the request. Every detail has to match before it is grouped." },
        tile: { delta: -20, note: "You didn't read the grouping tile." },
        terminal: { delta: -20, note: "You didn't check the group on record. It is the check that catches a sample taken from the wrong patient." },
      } },
    { id: "decide", name: "Her group", type: "talk", view: "bench", speaker: COLLEAGUE, say: "What's her group?", choices: decideChoices(st) },
  ];
  const d = v.decision;
  if (d === "wbit") {
    list.push({ id: "callback", name: "Call the ward", type: "talk", view: "phone", anchor: "phone", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.ward}. Is the blood ready?`, choices: [
      { text: `This is the blood bank about ${P.name}. Today's sample groups differently from her group on record, so it may be from someone else. We can't crossmatch it. Please take a new sample now, labelled at the bedside, and send it down. If she can't wait, the ${emergency} emergency units are ready for the doctor to sign for.`, reply: "Oh no. Taking a new one now." },
      { text: "Can you just relabel the tube with her details and send it back?", reply: "Relabel it?", delta: -30, critical: "Never relabel a sample. If it came from the wrong patient, relabelling makes the mistake permanent. A new sample, labelled at the bedside." },
      { text: "The sample's no good. Send another one.", reply: "Why? She's bleeding!", delta: -10, note: "Say why: the ward needs to know a sample may have come from the wrong patient, and that emergency units are there if she can't wait." },
    ] });
    return list;
  }
  if (d === "group") {
    list.push({ id: "xm", name: "Crossmatch", type: "seq", view: "fridge",
      task: `Take two ${short(v.group)} units from the fridge, crossmatch them against her plasma on a gel card, and spin the card.`,
      need: ["fridge", "gelcard", "centrifuge"],
      did: { fridge: `Took two ${short(v.group)} units from the blood bank fridge, checked in date and intact`, gelcard: "Set up the crossmatch on a gel card: her plasma against the donor cells", centrifuge: "Spun the gel card" },
      after: "Crossmatch compatible: no reaction with either unit. Compatibility labels printed and attached.",
      order: { gelcard: { delta: -5, note: "Take the units out first: the crossmatch needs their cells." }, centrifuge: { delta: -5, note: "Set up the gel card first, then spin it." } },
      set: { crossed: true } });
    list.push({ id: "issue", name: "Issue", type: "check", view: "bench", buttons: true, doneText: "I've checked: decide",
      task: "The porter is here to collect. Check his collection slip, the compatibility label on the unit and the request form against each other: name, date of birth, hospital number.",
      clues: ["slip", "label", "request"], need: ["slip", "label", "request"],
      missing: {
        slip: { delta: -30, critical: "You didn't check the collection slip. It is the porter's proof of which patient the blood is for: unchecked, blood goes to the wrong bed." },
        label: { delta: -15, note: "You didn't check the compatibility label on the unit against the slip." },
        request: { delta: -5, note: "Check the request form too: the three have to agree." },
      } });
    const ok = slipCase ? null : true;
    list.push({ id: "handover", name: "Hand over", type: "talk", view: "bench", speaker: PORTER, say: `I'm here for ${P.name}'s blood, please.`, choices: [
      { text: `Everything matches. Here it is: we both sign the register, and it has to be started within ${g.issue_minutes} minutes.`, reply: "Signed. On my way.",
        ...(ok ? {} : { delta: -30, critical: `The slip is for another ${P.name}: born ${NAMESAKE[P.key].dob}, ${NAMESAKE[P.key].hosp}, ${NAMESAKE[P.key].ward}. Same name, different patient. That unit is crossmatched for the woman on the maternity ward.` }) },
      { text: "Don't take it: your slip is for a different patient with the same name. The date of birth and hospital number don't match. I'll call the ward.", reply: "Oh! I'll go back and check.",
        ...(ok ? { delta: -15, note: "The slip, the label and the request all matched. Holding the blood back delays it for a bleeding woman." } : {}) },
      { text: "The name's right, so take it. You can sign the register later.", reply: "Okay, thanks.", delta: -30,
        critical: ok ? "Never hand blood over without both signing the register: it is the record of who took which unit, and when." : `The name matched, but nothing else did: the slip is for another ${P.name}. Check the date of birth and hospital number, every time.` },
    ] });
  }
  return list;
}

const CASE_NAME = { clean: "everything matches", wbit: "group differs from the record", slip: "the wrong patient's slip" };
const subject = (st, P) => `${P.name} · ${short(st.vars?.group || "")}, ${CASE_NAME[st.case]}`;

module.exports = {
  key: "bb-201",
  title: "BB-201 · Blood bank: the right unit",
  description: "A woman is bleeding after delivery. Check the sample, read the grouping tile, check her group on record, crossmatch, and issue to the porter only when the slip, the label and the request agree. Sometimes the sample is from someone else, or the slip is.",
  bay: "bloodbank",
  tourniquetLimit: 60,
  TUBES: {}, OBJECTS, NEUTRAL, PATIENTS, FORM_TESTS, ORDER_WHY: {},
  SETTINGS, steps, init, findings, specimen, subject,
};
