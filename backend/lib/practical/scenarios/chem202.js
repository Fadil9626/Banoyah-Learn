// CHEM-202 — a critical potassium, as a 3D practical.
//
// The chemistry analyser flags K+ 7.8 mmol/L on a renal patient and a colleague
// wants to phone it straight through. Before anything leaves the lab the result
// has to be checked: the sample (haemolysis), the full panel (the calcium and ALP
// that give EDTA contamination away), and today's QC. What the checks show is
// dealt at random every run — a real critical, a haemolysed sample, EDTA
// contamination, or a QC failure — and the right action is different for each,
// so nobody can learn the answer instead of the checks.
//
// A real critical is then phoned to someone who can act on it, identified by
// name, date of birth and lab number, and read back. Sometimes the read-back is
// wrong, and has to be caught.

const COLLEAGUE = "Mr Kallon (senior scientist)";

const OBJECTS = {
  tube: ["The sample", "U&E + bone profile, spun"],
  analyser: ["Chemistry analyser", "The full panel for this sample"],
  qc: ["QC chart", "Today's potassium QC, levels 1 and 2"],
  terminal: ["ELIMS terminal", "Earlier results and the request"],
  qcvials: ["QC material", "Fresh vials, levels 1 and 2"],
  phone: ["Phone", "Ward extensions are on the list beside it"],
  centrifuge: ["Centrifuge", ""],
  fridge: ["Reagent fridge", ""],
};
const NEUTRAL = ["phone", "centrifuge", "fridge"];

// Whose sample it is. The person in the room is the colleague (look).
const LAB_COAT = { skin: "#4e301d", shirt: "#f4f6f7", trousers: "#2c3e50", hair: "short" };
const PATIENTS = [
  { key: "mariatu", name: "Mariatu Sesay", female: true, sex: "Female", dob: "12/04/1958", age: 68, lab: "LAB-2026-1731",
    ward: "Renal unit", clinic: "Renal unit", doctor: "Dr A. Kamara", sister: "Sister Bangura", time: "09:40",
    tests: ["U&E", "Bone profile"], ticks: ["U&E", "Bone profile"],
    notes: "CKD stage 4. On lisinopril and spironolactone. Vomiting for 3 days.", look: LAB_COAT },
  { key: "alusine", name: "Alusine Koroma", female: false, sex: "Male", dob: "03/09/1971", age: 55, lab: "LAB-2026-1764",
    ward: "Medical ward", clinic: "Medical ward", doctor: "Dr F. Conteh", sister: "Sister Conteh", time: "10:15",
    tests: ["U&E", "Bone profile"], ticks: ["U&E", "Bone profile"],
    notes: "Type 2 diabetic on ramipril. Poor intake for a week. ?AKI.", look: LAB_COAT },
];
const FORM_TESTS = ["FBC", "ESR", "FBG", "RBS", "HbA1c", "U&E", "Bone profile", "LFT", "Lipids", "PT/INR", "Malaria RDT", "HBsAg"];

// QC targets for potassium, and the last ten points of each level in SD units.
const QC = { L1: { mean: 4.0, sd: 0.1 }, L2: { mean: 6.5, sd: 0.15 } };
const QC_OK = { L1: [0.3, -0.5, 0.8, -1.1, 0.2, 1.4, -0.6, 0.4, -0.2, 0.7], L2: [-0.4, 0.6, 1.1, -0.8, 0.2, -1.3, 0.5, 0.9, -0.1, 0.3] };
const QC_FAIL = { L1: [0.3, -0.5, 0.8, -1.1, 0.2, 1.4, -0.6, 0.4, -0.2, 1.6], L2: [-0.4, 0.6, 1.1, -0.8, 0.2, -1.3, 0.5, 0.9, -0.1, 3.3] };

// What the checks show in each case. Values in mmol/L unless the row says.
const CASES = {
  genuine: {
    serum: "#e3b94f", look: "Clear, straw-coloured serum above the gel.", indices: { H: 12, I: 2, L: 4 },
    panel: { Na: 133, K: 7.8, Cl: 100, HCO3: 15, urea: 38.2, creat: 612, Ca: 2.28, PO4: 2.1, ALP: 104, Alb: 31 },
    history: [["Yesterday", 6.4, 540, 2.31], ["3 days ago", 5.6, 455, 2.35]], qc: QC_OK,
  },
  haem: {
    serum: "#b8342c", look: "The serum is pink-red: the sample is haemolysed.", indices: { H: 380, I: 2, L: 5 },
    panel: { Na: 138, K: 7.8, Cl: 103, HCO3: 24, urea: 7.9, creat: 118, Ca: 2.36, PO4: 1.4, ALP: 82, Alb: 38 },
    history: [["2 days ago", 4.4, 112, 2.38], ["Last month", 4.2, 109, 2.34]], qc: QC_OK,
  },
  edta: {
    serum: "#e3b94f", look: "Clear, straw-coloured serum above the gel.", indices: { H: 10, I: 1, L: 3 },
    panel: { Na: 140, K: 7.8, Cl: 104, HCO3: 25, urea: 6.8, creat: 104, Ca: 0.62, PO4: 1.1, ALP: 9, Alb: 39 },
    history: [["2 days ago", 4.3, 101, 2.33], ["Last month", 4.1, 98, 2.36]], qc: QC_OK,
  },
  qc: {
    serum: "#e3b94f", look: "Clear, straw-coloured serum above the gel.", indices: { H: 9, I: 1, L: 4 },
    panel: { Na: 134, K: 7.8, Cl: 101, HCO3: 16, urea: 35.1, creat: 588, Ca: 2.31, PO4: 1.9, ALP: 98, Alb: 32 },
    history: [["Yesterday", 6.6, 551, 2.29], ["3 days ago", 5.9, 470, 2.33]], qc: QC_FAIL,
  },
};
const RERUN_K = 7.6;          // the QC case, once QC is back in control

const RANGES = {
  Na: ["Sodium", "135–145"], K: ["Potassium", "3.5–5.3"], Cl: ["Chloride", "95–108"], HCO3: ["Bicarbonate", "22–29"],
  urea: ["Urea", "2.5–7.8"], creat: ["Creatinine (µmol/L)", "45–110"], Ca: ["Calcium (adjusted)", "2.20–2.60"],
  PO4: ["Phosphate", "0.8–1.5"], ALP: ["ALP (U/L)", "30–130"], Alb: ["Albumin (g/L)", "35–50"],
};
const LIMITS = { Na: [135, 145], K: [3.5, 5.3], Cl: [95, 108], HCO3: [22, 29], urea: [2.5, 7.8], creat: [45, 110], Ca: [2.2, 2.6], PO4: [0.8, 1.5], ALP: [30, 130], Alb: [35, 50] };
const CRITICAL = { K: [2.5, 6.5], Ca: [1.8, 3.0], Na: [120, 160] };   // phone-through limits (lab to confirm)

const pickOne = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];

function init(st, P, rnd = Math.random) {
  st.case = pickOne(Object.keys(CASES), rnd);
  st.vars = { rbWrong: rnd() < 0.5 };
  st.found = [];
}

const kNow = (st) => (st.vars?.qcFixed ? RERUN_K : CASES[st.case].panel.K);
const flip = (k) => String(k).split(".").reverse().join(".");       // 7.8 heard as 8.7
const spoken = (k) => { const [a, b] = String(k).split("."); const w = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]; return `${w[a]} point ${w[b]}`; };

// What a check reveals, once it has been made. Nothing here is in the view
// until the learner has picked the thing up.
function findings(st, P) {
  const C = CASES[st.case], out = [];
  for (const id of st.found || []) {
    if (id === "tube") out.push({ id, type: "text", title: "The sample", lines: [C.look, `Serum indices from the analyser: H ${C.indices.H} · I ${C.indices.I} · L ${C.indices.L} (H above 100 is visibly haemolysed)`] });
    if (id === "analyser") {
      const p = { ...C.panel, K: kNow(st) };
      out.push({ id, type: "table", title: `Analyser: ${P.lab}${st.vars?.qcFixed ? " (re-run)" : ""}`, head: ["Test", "Result", "Range", ""],
        rows: Object.keys(RANGES).map((k) => {
          const v = p[k], [lo, hi] = LIMITS[k], cr = CRITICAL[k];
          const flag = cr && (v <= cr[0] || v >= cr[1]) ? "CRITICAL" : v < lo ? "L" : v > hi ? "H" : "";
          return [RANGES[k][0], String(v), RANGES[k][1], flag];
        }) });
    }
    if (id === "qc") {
      const pts = st.vars?.qcFixed ? { L1: [...C.qc.L1, -0.4], L2: [...C.qc.L2, 0.6] } : C.qc;
      out.push({ id, type: "qc", title: "QC: potassium, today's runs last", levels: ["L1", "L2"].map((L) => ({
        name: `Level ${L[1]} · target ${QC[L].mean.toFixed(1)} ± ${QC[L].sd} mmol/L`, points: pts[L],
        last: (QC[L].mean + QC[L].sd * pts[L][pts[L].length - 1]).toFixed(2),
      })), note: "Westgard: one point beyond 3 SD (1-3s) rejects the run." });
    }
    if (id === "terminal") out.push({ id, type: "table", title: `ELIMS: earlier results for ${P.name}`, head: ["When", "K⁺", "Creatinine", "Ca (adj)"],
      rows: C.history.map(([w, k, cr, ca]) => [w, String(k), String(cr), String(ca)]) });
  }
  return out;
}

// What the bay shows of the sample without anyone picking it up: a spun gold
// tube, and whatever colour the serum is.
function specimen(st) { return { serum: CASES[st.case].serum, k: kNow(st), qcFixed: !!st.vars?.qcFixed, qcFail: st.case === "qc" && !st.vars?.qcFixed }; }

const WHY = {
  haem: "The serum is visibly haemolysed (H-index 380). Haemolysis releases potassium from the red cells, so this 7.8 is false.",
  edta: "Potassium 7.8 with calcium 0.62 and ALP 9 is the pattern of K-EDTA contamination: EDTA is a potassium salt, and it binds the calcium and the zinc ALP needs. This 7.8 is false.",
  qc: "Today's level 2 potassium QC is +3.3 SD, a 1-3s failure. Nothing from this run can be released until the QC is back in control and the sample is re-run.",
  genuine: "The serum was clear (H-index 12), calcium and ALP normal, QC in control, and the potassium has been climbing for days (6.4 yesterday) with creatinine 612. This 7.8 is real.",
};

// The decision. Every case is offered the same four answers; what each costs
// depends on what the checks showed.
function decideChoices(st) {
  const c = st.case;
  const release = { text: "It's real. Release it and phone it to the ward now as a critical result.", reply: "Right. Make the call.", set: { decision: "release" } };
  const haem = { text: "Don't report the potassium. The sample is haemolysed: comment it and ask the ward to recollect.", reply: "Okay. Call the ward.", set: { decision: "haem" } };
  const edta = { text: "Don't report the potassium. It looks like EDTA contamination: ask the ward to recollect, gold tube before purple.", reply: "Okay. Call the ward.", set: { decision: "edta" } };
  const qc = { text: "Hold everything from this run. The QC is out: re-run the QC, then re-run the sample.", reply: "Go on then, quickly.", set: { decision: "qc" } };

  if (c === "genuine") {
    const withheld = { delta: -30, critical: `${WHY.genuine} Withholding a genuine critical potassium delays treatment for a patient at risk of cardiac arrest.` };
    Object.assign(haem, withheld); Object.assign(edta, withheld);
  }
  if (c !== "genuine" && c !== "qc") {
    release.delta = -30;
    release.critical = `${WHY[c]} A false critical can get a patient treated for something they don't have, while their real potassium is unknown.`;
  }
  if (c === "qc") {
    release.delta = -30; release.critical = WHY.qc;
    const slow = { delta: -20, note: "The sample was fine; the QC failed. Asking for a new sample delays a result that turned out to be real (7.6 on re-run), and gives the patient another needle." };
    Object.assign(haem, slow); Object.assign(edta, slow);
  } else {
    // Not a QC problem: the colleague points at the chart, and you decide again.
    Object.assign(qc, { set: null, reply: "The QC's fine: both levels are inside 2 SD today. Look again and decide.", again: true, delta: -10,
      note: "Today's QC was in control on both levels. Re-running costs time on a result the ward may be waiting to act on." });
  }
  if (c === "edta") Object.assign(haem, { delta: -10, note: "Right not to report it, wrong cause: the serum was clear (H-index 10). Low calcium and ALP with high potassium point to EDTA. The ward needs the real cause to fix it: fill the gold tube before the purple, and never pour from one tube into another." });
  if (c === "haem") Object.assign(edta, { delta: -10, note: "Right not to report it, wrong cause: the serum was pink (H-index 380) and the calcium normal. That is haemolysis. The ward needs the real cause to fix it: a gentle draw, no shaking, and no forcing blood through a narrow needle." });
  return [release, haem, edta, qc];
}

function steps(P, st = {}) {
  const v = st.vars || {}, K = kNow(st);
  const list = [
    { id: "alert", name: "The flag", type: "talk", view: "bench", speaker: COLLEAGUE,
      say: `The analyser's flagging a critical potassium on ${P.name} from the ${P.ward.toLowerCase()}: 7.8. They're busy up there. Shall I just phone it through now?`, choices: [
      { text: "Not yet. Two minutes: I'll check the sample, the full panel and today's QC. If it holds up, it goes straight out.", reply: "Fair enough. Be quick." },
      { text: "Yes, phone it now. It's critical, there's no time to check.", reply: "Okay...", delta: -15,
        note: "A critical result goes out fast, but only once you're sure it's real. Haemolysis, EDTA contamination and failed QC all make a false 7.8. Checking takes two minutes." },
      { text: "Leave it until the batch is finished and we'll send everything together.", reply: "Are you sure?", delta: -20,
        note: "Critical results are never batched. Once confirmed, they are phoned at once." },
    ] },
    { id: "check", name: "Check it", type: "check", view: "bench",
      task: "Check the result before it goes anywhere: look at the sample, read the full panel on the analyser, and check today's QC. ELIMS has this patient's earlier results.",
      clues: ["tube", "analyser", "qc", "terminal"], need: ["tube", "analyser", "qc"],
      missing: {
        tube: { delta: -10, note: "You didn't look at the sample. Pink or red serum means haemolysis, which releases potassium from the red cells." },
        analyser: { delta: -10, note: "You didn't read the full panel. A very low calcium and ALP beside a high potassium points to EDTA contamination." },
        qc: { delta: -10, note: "You didn't check the QC. If today's QC is out, no result from that run can be trusted." },
      } },
    { id: "decide", name: "Decide", type: "talk", view: "bench", speaker: COLLEAGUE, say: "So, what do we do with it?", choices: decideChoices(st) },
  ];
  const d = v.decision;
  if (d === "qc") list.push({ id: "fix", name: "Re-run", type: "seq", view: "analyser",
    task: "Load fresh QC material and run both levels on the analyser. Once the QC is back in control, the sample is re-run with it.",
    need: ["qcvials", "analyser"],
    order: { analyser: { delta: -5, note: "Load the fresh QC material first, then run it." } },
    after: `QC back in control (level 1 −0.4 SD, level 2 +0.6 SD); sample re-run: K⁺ ${RERUN_K} mmol/L`, set: { qcFixed: true } });

  const phoneStep = { type: "talk", view: "phone", anchor: "phone" };
  if (d === "release" || (d === "qc" && v.qcFixed)) {
    list.push({ ...phoneStep, id: "call", name: "Call the ward", speaker: `Ward clerk (${P.ward}, on the phone)`, say: `${P.ward}, ward clerk speaking.`, choices: [
      { text: `This is the lab, with a critical result for ${P.name}. Please put me through to the nurse looking after ${P.female ? "her" : "him"}, or the doctor.`, reply: `Hold on, I'll get ${P.sister}.` },
      { text: `Can you pass a message to the doctor? ${P.name}'s potassium is ${K}.`, reply: "Okay, I'll write it down somewhere...", delta: -25,
        note: "Give a critical result only to a nurse or doctor who can act on it, never as a message through a clerk. Messages get lost." },
      { text: "Never mind. I'll put it in ELIMS, they'll see it.", reply: "(You hang up.)", delta: -30,
        critical: "A critical result must be phoned to someone who can act on it, and acknowledged. Posted in ELIMS alone, nobody may see it for hours." },
    ] });
    list.push({ ...phoneStep, id: "give", name: "Give the result", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.sister} speaking. Go ahead.`, choices: [
      { text: `${P.name}, date of birth ${P.dob}, lab number ${P.lab}: potassium ${K} mmol/L. That's a critical result. Please read it back to me.`,
        reply: v.rbWrong ? `So that's ${P.name}, ${P.dob}, potassium ${flip(K)}?` : `So that's ${P.name}, ${P.dob}, lab number ${P.lab}, potassium ${K}.`, set: { asked: true } },
      { text: `Bed 4's potassium is ${K}. It's critical.`, reply: "Okay, thanks.", delta: -15,
        note: "Identify the patient by name, date of birth and lab number. Bed numbers change, and the wrong patient gets treated." },
      { text: `${P.name}'s potassium is ${K}. Bye.`, reply: "Oh, okay...", delta: -15,
        note: "Ask for a read-back. It is the only way to know the result was heard right." },
    ] });
    if (v.asked) {
      const rbSay = v.rbWrong ? `...potassium ${flip(K)}. Is that right?` : `...potassium ${K}. Got it.`;
      const choices = v.rbWrong ? [
        { text: `No, that's not right. Potassium ${K}: ${spoken(K)}. Please read it back again.`, reply: `Sorry: ${P.name}, potassium ${K}. I'll tell the doctor now.` },
        { text: "Yes, that's right. Thanks.", reply: "Thank you.", delta: -30,
          critical: `The read-back was wrong (${flip(K)} instead of ${K}) and you agreed. The ward will act on the wrong number. Listen to the read-back and correct it.` },
        { text: "Close enough, it's high either way.", reply: "Okay...", delta: -30,
          critical: `The read-back was wrong (${flip(K)} instead of ${K}). The dose of treatment depends on the number. Correct it and ask for a second read-back.` },
      ] : [
        { text: "That's correct. Can I take your name? I'll record that you received it, and the time.", reply: `${P.sister}. Thank you.` },
        { text: "That's right. Bye.", reply: "Bye.", delta: -10,
          note: "Record who took the result and when. The record shows the result reached someone who could act." },
      ];
      list.push({ ...phoneStep, id: "readback", name: "Read-back", speaker: `${P.sister} (${P.ward}, on the phone)`, say: rbSay, choices });
    }
  } else if (d === "haem" || d === "edta") {
    const why = d === "haem" ? "haemolysed" : "contaminated with EDTA from a purple tube";
    const tip = d === "haem" ? "a gentle draw, no shaking, and don't force the blood through a narrow needle" : "fill the gold tube before the purple, and never pour blood from one tube into another";
    list.push({ ...phoneStep, id: "recollect", name: "Call the ward", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.ward}, ${P.sister} speaking.`, choices: [
      { text: `This is the lab about ${P.name}, lab number ${P.lab}. The U&E sample is ${why}, so we can't report the potassium. Please recollect it urgently: ${tip}.`, reply: "Thanks for explaining. We'll recollect now." },
      { text: `${P.name}'s potassium came out at 7.8, but it's probably wrong.`, reply: "7.8?! I'll call the doctor right away.", delta: -30,
        critical: "Never give out a result you believe is false. Someone may treat it. Say it can't be reported, why, and what you need." },
      { text: "That sample's no good. Send another one.", reply: "Which one? And why?", delta: -10,
        note: "Say which patient and test, and why. The ward needs the reason to get the next sample right." },
    ] });
  }
  return list;
}

const CASE_NAME = { genuine: "a real critical", haem: "a haemolysed sample", edta: "EDTA contamination", qc: "a QC failure" };
const subject = (st, P) => `${P.name} · K⁺ 7.8, ${CASE_NAME[st.case]}`;

module.exports = {
  key: "chem-202",
  title: "CHEM-202 · Critical potassium",
  description: "Chemistry bench: the analyser flags K⁺ 7.8. Check the sample, the full panel and the QC before it goes anywhere, then act: phone a real critical with read-back, or stop a false one. The cause changes every run.",
  bay: "chemistry",
  tourniquetLimit: 60,
  TUBES: {}, OBJECTS, NEUTRAL, PATIENTS, CASES, FORM_TESTS, ORDER_WHY: {},
  steps, init, findings, specimen, subject,
};
