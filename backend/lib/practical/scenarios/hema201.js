// HEMA-201 — a low platelet count, settled at the microscope.
//
// The haematology analyser reports platelets 18 ×10⁹/L, a critical value. Before
// it goes anywhere the learner checks the sample, the full count and its flags,
// and today's QC, then makes and stains a blood film and looks at it: the
// feathered edge, where clumps are pushed when the film is spread, and the body.
//
// What the checks show is dealt at random every run:
//   clumps   EDTA-induced platelet clumping: the count is falsely low. Don't
//            report it; ask for a citrate tube for the repeat count.
//   true     a real thrombocytopenia: phone it as a critical, with read-back.
//   clot     a partly clotted sample: the whole count is unreliable. Reject it.
//
// Lab to confirm: the critical limit (below 20), the ×15 film estimate factor,
// the stain (Leishman), and the read-back procedure.

const COLLEAGUE = "Mrs Sankoh (senior scientist)";

const OBJECTS = {
  tube: ["The sample", "EDTA (purple), FBC"],
  analyser: ["Haematology analyser", "The full count and its flags"],
  qc: ["QC chart", "Today's platelet QC, three levels"],
  terminal: ["ELIMS terminal", "Earlier results"],
  slides: ["Slides and spreader", "Clean slides, a spreader slide"],
  stain: ["Staining rack", "Leishman stain and buffer, pH 6.8"],
  microscope: ["Microscope", "×100 oil immersion"],
  qcvials: ["QC material", ""],
  phone: ["Phone", "Ward extensions are on the list beside it"],
  fridge: ["Reagent fridge", ""],
  // where to look on the film: offered as buttons, not things in the room
  feather: ["Feathered edge", "The thin end of the film"],
  body: ["Body of the film", "Where the cells just touch"],
  count: ["Count platelets", "Ten oil fields in the body"],
};
const NEUTRAL = ["phone", "fridge", "qcvials"];

const LAB_COAT = { skin: "#5a3620", shirt: "#f4f6f7", trousers: "#2c3e50", hair: "headtie" };
const PATIENTS = [
  { key: "fatmata", name: "Fatmata Conteh", female: true, sex: "Female", dob: "21/06/1991", age: 35, lab: "LAB-2026-2214",
    ward: "Surgical ward", clinic: "Surgical ward", doctor: "Dr S. Kanu", sister: "Sister Kamara", time: "08:50",
    tests: ["FBC"], ticks: ["FBC"], notes: "Elective hernia repair tomorrow. Pre-op bloods.", look: LAB_COAT },
  { key: "mohamed", name: "Mohamed Bangura", female: false, sex: "Male", dob: "09/11/1979", age: 46, lab: "LAB-2026-2251",
    ward: "Medical ward", clinic: "Medical ward", doctor: "Dr A. Sesay", sister: "Sister Turay", time: "11:05",
    tests: ["FBC"], ticks: ["FBC"], notes: "Fever for 5 days. Malaria RDT negative. Bruising on the arms.", look: LAB_COAT },
];
const FORM_TESTS = ["FBC", "ESR", "Blood film", "Retics", "Sickling", "PT/INR", "APTT", "Malaria RDT", "Blood group", "HbA1c", "U&E", "LFT"];

const PLT = 18;
const CRIT_LOW = 20;      // phone-through limit, ×10⁹/L (lab to confirm)

// Today's platelet QC, in SD units, all three levels in control.
const QC = { L1: { mean: 75, sd: 6 }, L2: { mean: 230, sd: 12 }, L3: { mean: 480, sd: 22 } };
const QC_PTS = { L1: [0.4, -0.6, 0.9, -0.2, 1.1, -0.8, 0.3, 0.6, -0.4, 0.2], L2: [-0.3, 0.5, -1.0, 0.7, 0.1, -0.5, 1.2, -0.2, 0.4, -0.6], L3: [0.6, -0.2, 0.3, -1.1, 0.8, 0.2, -0.4, 0.9, -0.7, 0.5] };

// What each check shows, in each case. Film fields are drawn from these numbers
// in the browser; the case itself never leaves the server.
const CASES = {
  clumps: {
    tube: "No clots: two applicator sticks come out clean, and the sample mixes smoothly. Filled to the line.",
    panel: { WBC: 7.4, RBC: 4.62, Hb: 13.2, HCT: 0.4, MCV: 87, MPV: null }, flags: "PLT clumps?",
    history: [["Pre-op clinic, 3 weeks ago", 262, 13.4]],
    feather: { singles: 3, clumps: 6, fibrin: 0 }, body: { singles: 4, clumps: 1, fibrin: 0 }, avg: 4,
  },
  true: {
    tube: "No clots: two applicator sticks come out clean, and the sample mixes smoothly. Filled to the line.",
    panel: { WBC: 3.2, RBC: 3.94, Hb: 10.8, HCT: 0.33, MCV: 85, MPV: 11.9 }, flags: "None",
    history: [["Yesterday", 41, 11.2], ["2 days ago", 88, 11.9]],
    feather: { singles: 1, clumps: 0, fibrin: 0, giant: 1 }, body: { singles: 1, clumps: 0, fibrin: 0, giant: 1 }, avg: 1.2,
  },
  clot: {
    tube: "A small clot comes out on the applicator stick: the sample is partly clotted.",
    panel: { WBC: 6.1, RBC: 4.4, Hb: 12.4, HCT: 0.38, MCV: 88, MPV: null }, flags: "PLT clumps?",
    history: [["Last month", 248, 12.9]],
    feather: { singles: 2, clumps: 4, fibrin: 3 }, body: { singles: 3, clumps: 1, fibrin: 1 }, avg: 3,
  },
};
const ROWS = [["WBC", "WBC (×10⁹/L)", "4.0–11.0", [4, 11]], ["RBC", "RBC (×10¹²/L)", "3.8–5.8", [3.8, 5.8]], ["Hb", "Haemoglobin (g/dL)", "12.0–17.0", [12, 17]],
  ["HCT", "Haematocrit (L/L)", "0.36–0.50", [0.36, 0.5]], ["MCV", "MCV (fL)", "80–100", [80, 100]], ["PLT", "Platelets (×10⁹/L)", "150–400", [150, 400]], ["MPV", "MPV (fL)", "7.5–11.5", [7.5, 11.5]]];

function init(st, P, rnd = Math.random) {
  const keys = Object.keys(CASES);
  st.case = keys[Math.floor(rnd() * keys.length)];
  st.vars = { rbWrong: rnd() < 0.5 };
  st.found = [];
}

function findings(st, P) {
  const C = CASES[st.case], out = [];
  for (const id of st.found || []) {
    if (id === "tube") out.push({ id, type: "text", title: "The sample", lines: [C.tube] });
    if (id === "analyser") out.push({ id, type: "table", title: `Analyser: ${P.lab}`, head: ["Test", "Result", "Range", ""],
      rows: [...ROWS.map(([k, name, range, [lo, hi]]) => {
        const v = k === "PLT" ? PLT : C.panel[k];
        if (v == null) return [name, "---", range, ""];
        const flag = k === "PLT" && v < CRIT_LOW ? "CRITICAL" : v < lo ? "L" : v > hi ? "H" : "";
        return [name, k === "HCT" ? v.toFixed(2) : String(v), range, flag];
      }), ["Analyser flags", C.flags, "", ""]] });
    if (id === "qc") out.push({ id, type: "qc", title: "QC: platelets, today's run last", levels: ["L1", "L2", "L3"].map((L) => ({
      name: `Level ${L[1]} · target ${QC[L].mean} ± ${QC[L].sd} ×10⁹/L`, points: QC_PTS[L],
      last: String(Math.round(QC[L].mean + QC[L].sd * QC_PTS[L][QC_PTS[L].length - 1])),
    })), note: "Westgard: one point beyond 3 SD (1-3s) rejects the run." });
    if (id === "terminal") out.push({ id, type: "table", title: `ELIMS: earlier results for ${P.name}`, head: ["When", "Platelets", "Hb"],
      rows: C.history.length ? C.history.map(([w, p, hb]) => [w, String(p), String(hb)]) : [["No earlier results", "", ""]] });
    if (id === "feather" || id === "body") {
      const n = id.charCodeAt(0) + (st.case.length * 7) + (P.key.length * 13);
      out.push({ id, type: "field", title: id === "feather" ? "Feathered edge · ×100 oil" : "Body of the film · ×100 oil", seed: n, ...C[id] });
    }
    if (id === "count") out.push({ id, type: "text", title: "Platelet estimate from the film",
      lines: [`Average single platelets per oil field (10 fields, body of the film): ${C.avg}.`, `Estimate: ${C.avg} × 15 ≈ ${Math.round(C.avg * 15)} ×10⁹/L. Analyser: ${PLT}.`] });
  }
  return out;
}

// What the bay draws: what has been done at the bench.
function specimen(st) { return { used: st.used || [], plt: PLT }; }

const WHY = {
  clumps: "The film shows platelets in clumps, most of them pushed to the feathered edge, and the analyser flagged \"PLT clumps?\". EDTA makes some people's platelets clump; the analyser counts a clump as one big cell, or not at all. This 18 is false.",
  clot: "The sample is partly clotted: a clot on the applicator stick, fibrin strands and clumps on the film. Clotting uses up platelets. This 18 is false, and the rest of the count can't be trusted either.",
  true: "The tube had no clot, the film shows few platelets and no clumps, the estimate agrees, QC is in control, and the count has been falling for days (88, then 41). This 18 is real.",
};

function decideChoices(st) {
  const c = st.case;
  const release = { text: "It's real. Validate it and phone it to the ward now as a critical result.", reply: "Right. Make the call.", set: { decision: "release" } };
  const clumps = { text: "Don't report the count. The platelets are clumping in the EDTA: comment it, and ask for a citrate (light blue) sample for the repeat count.", reply: "Okay. Call the ward.", set: { decision: "clumps" } };
  const clot = { text: "Reject it. The sample is partly clotted: ask the ward for a new EDTA sample.", reply: "Okay. Call the ward.", set: { decision: "clot" } };
  const rerun = { text: "Run the sample through the analyser again first.", reply: "Same tube, same answer: it's 18 again. The tube and the film tell you why. Decide.", again: true, delta: -5,
    note: "Re-running the same tube gives the same count. The film and the tube are what tell you whether it is real." };
  if (c === "true") {
    const withheld = { delta: -30, critical: `${WHY.true} Withholding it delays treatment for a patient at risk of bleeding.` };
    Object.assign(clumps, withheld); Object.assign(clot, withheld);
  } else {
    release.delta = -30;
    release.critical = `${WHY[c]} A false critical can get a patient a platelet transfusion they don't need, or their operation cancelled.`;
  }
  if (c === "clumps") Object.assign(clot, { delta: -10, note: "Right not to report it, wrong cause: the applicator sticks came out clean and there was no fibrin. A new EDTA tube will clump again: the repeat count needs a citrate tube." });
  if (c === "clot") Object.assign(clumps, { delta: -10, note: "Right not to report it, wrong cause: there was a clot in the tube. A clotted sample spoils the whole count, not only the platelets: reject it and ask for a new EDTA sample, mixed straight after filling." });
  return [release, clumps, clot, rerun];
}

function steps(P, st = {}) {
  const v = st.vars || {}, him = P.female ? "her" : "him";
  const list = [
    { id: "alert", name: "The flag", type: "talk", view: "bench", speaker: COLLEAGUE,
      say: `The analyser's reporting platelets ${PLT} on ${P.name} from the ${P.ward.toLowerCase()}. That's critical. Shall I just validate it and phone the ward?`, choices: [
        { text: "Not yet. I'll check the sample, the full count and flags, and today's QC, then look at a film. If it's real, it goes straight out.", reply: "Fair enough. Be quick." },
        { text: "Yes, validate it and phone it now.", reply: "Okay...", delta: -15,
          note: "A platelet count this low can be false: clumping in EDTA and small clots both bring it down. Check, and look at a film: it takes minutes." },
        { text: "Validate it and leave it in ELIMS. The ward will see it.", reply: "Are you sure?", delta: -20,
          note: "A critical result is never just left in ELIMS. Check it, then phone it if it is real." },
      ] },
    { id: "check", name: "Check it", type: "check", view: "bench", doneText: "I've checked: make a film",
      task: "Check the result: look at the sample (check it for clots), read the full count and its flags on the analyser, and check today's QC. ELIMS has earlier results.",
      clues: ["tube", "analyser", "qc", "terminal"], need: ["tube", "analyser", "qc"],
      missing: {
        tube: { delta: -10, note: "You didn't check the sample for clots. A partly clotted sample uses up platelets and gives a falsely low count." },
        analyser: { delta: -10, note: "You didn't read the full count. The analyser's flags (\"PLT clumps?\") are a warning in themselves." },
        qc: { delta: -10, note: "You didn't check the QC. If today's QC is out, no count from that run can be trusted." },
      } },
    { id: "film", name: "Make a film", type: "seq", view: "stain",
      task: "Make a blood film: mix the sample, spread a thin film and let it dry, stain it, and put it on the microscope.",
      need: ["tube", "slides", "stain", "microscope"],
      did: { tube: "Mixed the sample by gentle inversion", slides: "Spread a thin film (spreader at 30–45°, one smooth push) and air-dried it",
        stain: "Stained the film with Leishman and rinsed it in buffer", microscope: "Put the film on the microscope, oil on, ×100" },
      order: {
        slides: { delta: -5, note: "Mix the sample first, by gentle inversion: the cells settle within minutes, and a film from an unmixed tube misleads." },
        stain: { delta: -5, note: "Make and dry the film first, then stain it." },
        microscope: { delta: -5, note: "Stain the film first: unstained, it shows almost nothing." },
      } },
    { id: "look", name: "At the microscope", type: "check", view: "scope", buttons: true, doneText: "I've looked: decide",
      task: "Look at the film under oil. Platelet clumps are pushed to the feathered edge when the film is spread, so look there as well as in the body. You can estimate the count too.",
      clues: ["feather", "body", "count"], need: ["feather", "body"],
      info: { microscope: "You're at the microscope. Choose where on the film to look, below the bay.", slides: "The film is on the microscope.", stain: "The film is stained." },
      missing: {
        feather: { delta: -15, note: "You didn't look at the feathered edge. When a film is spread, clumps are pushed to its thin end: that is where they are found." },
        body: { delta: -10, note: "You didn't look at the body of the film, where the cells just touch: that is where platelets are counted." },
      } },
    { id: "decide", name: "Decide", type: "talk", view: "bench", speaker: COLLEAGUE, say: "So, what do we do with it?", choices: decideChoices(st) },
  ];
  const d = v.decision, phone = { type: "talk", view: "phone", anchor: "phone" };
  if (d === "release") {
    list.push({ ...phone, id: "call", name: "Call the ward", speaker: `Ward clerk (${P.ward}, on the phone)`, say: `${P.ward}, ward clerk speaking.`, choices: [
      { text: `This is the lab, with a critical result for ${P.name}. Please put me through to the nurse looking after ${him}, or the doctor.`, reply: `Hold on, I'll get ${P.sister}.` },
      { text: `Can you pass a message to the doctor? ${P.name}'s platelets are ${PLT}.`, reply: "Okay, I'll write it down somewhere...", delta: -25,
        note: "Give a critical result only to a nurse or doctor who can act on it, never as a message through a clerk." },
      { text: "Never mind. It's in ELIMS, they'll see it.", reply: "(You hang up.)", delta: -30,
        critical: "A critical result must be phoned to someone who can act on it, and acknowledged. Posted in ELIMS alone, nobody may see it for hours." },
    ] });
    list.push({ ...phone, id: "give", name: "Give the result", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.sister} speaking. Go ahead.`, choices: [
      { text: `${P.name}, date of birth ${P.dob}, lab number ${P.lab}: platelets ${PLT} ×10⁹/L. That's a critical result. Please read it back to me.`,
        reply: v.rbWrong ? `So that's ${P.name}, ${P.dob}, platelets eighty?` : `So that's ${P.name}, ${P.dob}, lab number ${P.lab}, platelets ${PLT}.`, set: { asked: true } },
      { text: `Bed 6's platelets are ${PLT}. It's critical.`, reply: "Okay, thanks.", delta: -15,
        note: "Identify the patient by name, date of birth and lab number. Bed numbers change, and the wrong patient gets treated." },
      { text: `${P.name}'s platelets are ${PLT}. Bye.`, reply: "Oh, okay...", delta: -15, note: "Ask for a read-back. It is the only way to know the result was heard right." },
    ] });
    if (v.asked) list.push({ ...phone, id: "readback", name: "Read-back", speaker: `${P.sister} (${P.ward}, on the phone)`,
      say: v.rbWrong ? "...platelets eighty. Is that right?" : `...platelets ${PLT}. Got it.`,
      choices: v.rbWrong ? [
        { text: `No, that's not right. Platelets eighteen: one, eight. ${PLT} ×10⁹/L. Please read it back again.`, reply: `Sorry: ${P.name}, platelets eighteen. I'll tell the doctor now.` },
        { text: "Yes, that's right. Thanks.", reply: "Thank you.", delta: -30,
          critical: `The read-back was wrong (80 instead of ${PLT}) and you agreed. Eighty would not worry anyone; eighteen needs a doctor now. Listen to the read-back and correct it.` },
        { text: "Close enough, it's low either way.", reply: "Okay...", delta: -30,
          critical: `The read-back was wrong (80 instead of ${PLT}). At 80 nobody acts; at 18 the patient may need a transfusion. Correct it and ask for a second read-back.` },
      ] : [
        { text: "That's correct. Can I take your name? I'll record that you received it, and the time.", reply: `${P.sister}. Thank you.` },
        { text: "That's right. Bye.", reply: "Bye.", delta: -10, note: "Record who took the result and when. The record shows the result reached someone who could act." },
      ] });
  } else if (d === "clumps" || d === "clot") {
    const ok = d === "clumps"
      ? `This is the lab about ${P.name}, lab number ${P.lab}. We can't report the platelet count: the platelets are clumping in the EDTA tube, and the film shows plenty of them in clumps. Please send a light-blue citrate tube for a repeat platelet count.`
      : `This is the lab about ${P.name}, lab number ${P.lab}. The FBC sample is partly clotted, so we can't report any of the count. Please recollect an EDTA sample, and mix it gently 8 to 10 times straight after filling.`;
    list.push({ ...phone, id: "recollect", name: "Call the ward", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.ward}, ${P.sister} speaking.`, choices: [
      { text: ok, reply: "Thanks for explaining. We'll send it now." },
      { text: `${P.name}'s platelets came out at ${PLT}, but it's probably wrong.`, reply: `${PLT}?! I'll call the doctor right away.`, delta: -30,
        critical: "Never give out a result you believe is false. Someone may treat it. Say it can't be reported, why, and what you need." },
      { text: "That FBC's no good. Send another purple tube.", reply: "Which one? And why?", delta: -10,
        note: d === "clumps" ? "Say which patient and why. Another EDTA (purple) tube will clump the same way: the repeat count needs a citrate (light blue) tube." : "Say which patient and why: the ward needs the reason to get the next sample right (mix it straight after filling)." },
    ] });
  }
  return list;
}

const CASE_NAME = { clumps: "platelet clumps", true: "a real thrombocytopenia", clot: "a clotted sample" };
const subject = (st, P) => `${P.name} · PLT ${PLT}, ${CASE_NAME[st.case]}`;

module.exports = {
  key: "hema-201",
  title: "HEMA-201 · Low platelets",
  description: "The analyser reports platelets 18. Check the sample, the count and its flags and the QC, make and stain a film, and look at it under oil: clumps at the feathered edge, a clot, or a real low count. Then act: phone a real critical with read-back, or stop a false one. The cause changes every run.",
  bay: "haematology",
  tourniquetLimit: 60,
  TUBES: {}, OBJECTS, NEUTRAL, PATIENTS, CASES, FORM_TESTS, ORDER_WHY: {},
  steps, init, findings, specimen, subject,
};
