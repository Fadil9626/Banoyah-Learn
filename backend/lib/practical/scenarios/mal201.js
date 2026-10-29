// MAL-201 — malaria microscopy, as a 3D practical at the haematology bench.
//
// The ward phones: the patient's malaria RDT was positive, can the lab skip the
// film? The learner makes thick and thin films, stains them, and reads them
// under oil: the thick film to find and count parasites, the thin film for the
// species, ELIMS for the history. Then the report, quantified.
//
// What the film shows is dealt at random every run:
//   falciparum  P. falciparum rings and a gametocyte, a routine density: report
//               the species and parasites/µL.
//   severe      P. falciparum at a severe density, several rings to a cell:
//               phone it as a critical, and catch a read-back off by a nought.
//   negative    a positive RDT, but no parasites in the full search: the patient
//               was treated 16 days ago and HRP2 lingers. Report negative, and
//               only after the full number of fields.
//
// A lab sets its own figures in Settings › Practicals: the white-cell count the
// density assumes, the fields to search before calling it negative, the density
// it treats as severe, and the stain.

const COLLEAGUE = "Mrs Sankoh (senior scientist)";

const OBJECTS = {
  tube: ["The sample", "EDTA (purple), malaria film"],
  slides: ["Slides and spreader", "Clean slides, a spreader slide"],
  stain: ["Staining rack", "Methanol for the thin film, and Giemsa"],
  microscope: ["Microscope", "×100 oil immersion"],
  terminal: ["ELIMS terminal", "Earlier results"],
  analyser: ["Haematology analyser", ""], qc: ["QC chart", ""], qcvials: ["QC material", ""], phone: ["Phone", ""], fridge: ["Reagent fridge", ""],
  // where to look: offered as buttons, not things in the room
  thick: ["Thick film", "Finds parasites; counts them against white cells"],
  thin: ["Thin film", "Shows the species, inside intact red cells"],
  count: ["Count parasites", "Against 200 white cells, or per 1,000 red cells"],
  more: ["Keep searching", "Work through the rest of the fields"],
};
const NEUTRAL = ["analyser", "qc", "qcvials", "phone", "fridge"];

const LAB_COAT = { skin: "#5a3620", shirt: "#f4f6f7", trousers: "#2c3e50", hair: "headtie" };
const PATIENTS = [
  { key: "aminata", name: "Aminata Kamara", female: true, sex: "Female", dob: "14/02/2022", age: 4, lab: "LAB-2026-2380",
    ward: "Paediatric ward", clinic: "Paediatric ward", doctor: "Dr M. Conteh", sister: "Nurse Bangura", time: "13:10",
    tests: ["Malaria film"], ticks: ["Malaria film", "Malaria RDT"], notes: "Fever 3 days, vomiting. Malaria RDT positive on the ward.", look: LAB_COAT },
  { key: "ibrahim", name: "Ibrahim Sesay", female: false, sex: "Male", dob: "30/07/1994", age: 32, lab: "LAB-2026-2402",
    ward: "Medical ward", clinic: "Medical ward", doctor: "Dr A. Sesay", sister: "Sister Turay", time: "15:40",
    tests: ["Malaria film"], ticks: ["Malaria film", "Malaria RDT"], notes: "Fever and rigors 2 days. Malaria RDT positive in OPD.", look: LAB_COAT },
];
const FORM_TESTS = ["FBC", "Malaria film", "Malaria RDT", "Blood film", "Sickling", "Blood group", "ESR", "Widal", "RBS", "U&E", "LFT", "HBsAg"];

const SETTINGS = [
  { key: "wbc_assumed", label: "White-cell count assumed for the parasite density", type: "number", unit: "/µL", default: 8000, min: 4000, max: 12000, step: 500,
    help: "Density = parasites counted × this ÷ 200 white cells. Use the patient's own count where your SOP says so; the practical uses this figure." },
  { key: "fields_negative", label: "Thick-film fields to search before reporting negative", type: "number", unit: "fields", default: 100, min: 50, max: 300, step: 10 },
  { key: "severe_density", label: "P. falciparum density treated as severe (phoned as critical)", type: "number", unit: "parasites/µL", default: 250000, min: 10000, max: 300000, step: 5000,
    help: "The severe case in this practical is 325,000/µL and the routine one about 2,000/µL, so the figure must sit between them." },
  { key: "stain_name", label: "Stain used for malaria films", type: "text", default: "Giemsa", maxLength: 40, help: "e.g. Giemsa, Field's." },
];
const DEFAULTS = Object.fromEntries(SETTINGS.map((f) => [f.key, f.default]));
const cf = (st) => ({ ...DEFAULTS, ...(st.cfg || {}) });

// What each look shows. Parasites per 200 white cells on the thick film; for
// the severe case the thin film is counted instead (per 1,000 red cells).
const CASES = {
  falciparum: {
    thick: { kind: "thick", rings: 9, gams: 1, wbc: 3 }, thin: { kind: "thin", rings: 3, gams: 1 },
    per200: 48, history: [["Never tested here", "", ""]],
  },
  severe: {
    thick: { kind: "thick", rings: 70, gams: 0, wbc: 2 }, thin: { kind: "thin", rings: 16, multi: true },
    perThousand: 65, history: [["Never tested here", "", ""]],
  },
  negative: {
    thick: { kind: "thick", rings: 0, gams: 0, wbc: 4 }, thin: { kind: "thin", rings: 0 },
    history: [["16 days ago", "P. falciparum 45,000/µL", "Treated: artemether-lumefantrine"]],
  },
};
const RBC = 5_000_000;       // red cells per µL, for a thin-film parasitaemia

function init(st, P, rnd = Math.random) {
  const keys = Object.keys(CASES);
  st.case = keys[Math.floor(rnd() * keys.length)];
  st.vars = { rbWrong: rnd() < 0.5 };
  st.found = [];
}

const n = (x) => Math.round(x).toLocaleString("en-GB");
function density(st) {
  const C = CASES[st.case], g = cf(st);
  if (C.per200 != null) return C.per200 * g.wbc_assumed / 200;
  if (C.perThousand != null) return (C.perThousand / 1000) * RBC;
  return 0;
}

function findings(st, P) {
  const C = CASES[st.case], g = cf(st), out = [];
  for (const id of st.found || []) {
    if (id === "thick" || id === "thin") {
      const seed = id.charCodeAt(1) * 7 + st.case.length * 11 + P.key.length * 5;
      out.push({ id, type: "field", title: id === "thick" ? "Thick film · ×100 oil" : "Thin film · ×100 oil", seed, singles: 3, clumps: 0, ...C[id] });
    }
    if (id === "count") out.push({ id, type: "text", title: "Parasite count", lines:
      C.per200 != null ? [`Thick film: ${C.per200} asexual parasites counted against 200 white cells.`, `Density: ${C.per200} × ${n(g.wbc_assumed)} ÷ 200 = ${n(density(st))} parasites/µL.`]
      : C.perThousand != null ? [`Too many to count against white cells: counted on the thin film instead.`, `${C.perThousand} of 1,000 red cells parasitised (${(C.perThousand / 10).toFixed(1)}%), several with two or more rings.`, `Density: ${(C.perThousand / 10).toFixed(1)}% × ${n(RBC)} red cells/µL ≈ ${n(density(st))} parasites/µL.`]
      : ["No parasites to count."] });
    if (id === "more") out.push({ id, type: "text", title: "The rest of the search", lines: [C.thick.rings
      ? `Parasites throughout the film. Thin film: ${C.thin.gams ? "ring forms and a crescent-shaped (banana) gametocyte" : "ring forms only, many cells with two or more"}.`
      : `${g.fields_negative} thick-film fields searched: no malaria parasites seen.`] });
    if (id === "terminal") out.push({ id, type: "table", title: `ELIMS: earlier results for ${P.name}`, head: ["When", "Malaria film", "Note"],
      rows: C.history.map((r) => r.map(String)) });
  }
  return out;
}

// The analyser stays idle in this practical; the bay draws the film being made.
function specimen(st) { return { used: st.used || [], plt: null }; }
const objects = (st) => ({ ...OBJECTS, stain: ["Staining rack", `Methanol for the thin film, and ${cf(st).stain_name}`] });

function decideChoices(st) {
  const c = st.case, g = cf(st), sev = n(g.severe_density);
  const pos = { text: "Positive for P. falciparum: report the species and the density.", reply: "Good. Put it in ELIMS.", set: { decision: "pos" } };
  const severe = { text: "Positive for P. falciparum at a severe density: phone it to the ward now as a critical result.", reply: "Right. Make the call.", set: { decision: "severe" } };
  const neg = { text: `No malaria parasites in ${g.fields_negative} fields: report it negative, with a note that the RDT can stay positive for weeks after treatment.`, reply: "Okay. Put it in ELIMS.", set: { decision: "neg" } };
  const rdt = { text: "Report it positive: the RDT was positive anyway.", reply: "On the RDT alone?", set: { decision: "pos" } };
  if (c === "falciparum") {
    Object.assign(severe, { delta: -10, note: `The density is about ${n(density(st))}/µL, well under this lab's severe level (${sev}/µL). Phoning it as severe sends a ward into an emergency it doesn't have.` });
    Object.assign(neg, { delta: -30, critical: "There were rings on both films and a gametocyte on the thin film. Reporting it negative leaves a child with malaria untreated." });
    Object.assign(rdt, { delta: -10, note: "Right answer, wrong reason: the film shows it. Report the species and the density, which the RDT can't give." });
  }
  if (c === "severe") {
    Object.assign(pos, { delta: -30, critical: `The density is about ${n(density(st))}/µL, above this lab's severe level (${sev}/µL), with several rings to a cell. That is severe malaria: a routine report delays IV artesunate.` });
    Object.assign(neg, { delta: -30, critical: "Both films were full of rings. Reporting it negative could cost a life." });
    Object.assign(rdt, { delta: -30, critical: `A positive without a density hides that this is severe: about ${n(density(st))}/µL. Phone it.` });
  }
  if (c === "negative") {
    const why = "No parasites in the full search, and ELIMS shows P. falciparum treated 16 days ago: the RDT's HRP2 antigen stays in the blood for weeks after treatment.";
    Object.assign(pos, { delta: -30, critical: `${why} Reporting malaria you didn't see means more antimalarials, and the real cause of the fever goes unlooked for.` });
    Object.assign(severe, { delta: -30, critical: `${why} There was nothing to phone.` });
    Object.assign(rdt, { delta: -30, critical: `${why} The film decides it, not the RDT.` });
  }
  return [pos, severe, neg, rdt];
}

function steps(P, st = {}) {
  const v = st.vars || {}, g = cf(st), D = n(density(st)), him = P.female ? "her" : "him";
  const negative = st.case === "negative";
  const list = [
    { id: "alert", name: "The request", type: "talk", view: "phone", anchor: "phone", speaker: `${P.sister} (${P.ward}, on the phone)`,
      say: `It's the ${P.ward.toLowerCase()} about ${P.name}. The malaria RDT was positive. The doctor wants to start treatment: can you skip the film and just confirm it's positive?`, choices: [
        { text: "We'll do the film now: it shows the species and how heavy the infection is, and an RDT can stay positive after treatment. I'll call you back with the result.", reply: "Okay. Please be quick." },
        { text: "Yes, if the RDT's positive, it's malaria. I'll report it positive.", reply: "Thank you!", delta: -20,
          note: "An RDT can't tell the species or the density, and it can stay positive for weeks after treatment. The film decides it." },
        { text: "We're busy. It'll be tomorrow.", reply: "Tomorrow?!", delta: -20, note: "A malaria film for a sick patient is urgent: report it within the hour." },
      ] },
    { id: "film", name: "Make the films", type: "seq", view: "stain",
      task: "Make a thick film and a thin film from the mixed sample, let them dry, fix the thin film only, stain both, and put them on the microscope.",
      need: ["tube", "slides", "stain", "microscope"],
      did: { tube: "Mixed the sample by gentle inversion", slides: "Made a thick film and a thin film, and let them air-dry",
        stain: `Fixed the thin film in methanol (keeping it off the thick film) and stained both with ${g.stain_name}`, microscope: "Put the films on the microscope, oil on, ×100" },
      order: {
        slides: { delta: -5, note: "Mix the sample first, by gentle inversion." },
        stain: { delta: -5, note: "Make the films and let them dry before they are stained." },
        microscope: { delta: -5, note: "Stain the films first: unstained, parasites can't be seen." },
      } },
    { id: "look", name: "At the microscope", type: "check", view: "scope", buttons: true, doneText: "I've looked: decide",
      task: `Read the films under oil: the thick film to find parasites and count them, the thin film for the species. A negative needs ${g.fields_negative} thick-film fields searched. ELIMS has earlier results.`,
      clues: ["thick", "thin", "count", "more", "terminal"], need: negative ? ["thick", "thin", "more"] : ["thick", "thin", "count"],
      info: { microscope: "You're at the microscope. Choose what to look at, below the bay.", slides: "The films are on the microscope.", stain: "The films are stained." },
      missing: {
        thick: { delta: -15, note: "You didn't read the thick film. It concentrates the blood: it is where parasites are found." },
        thin: { delta: -10, note: "You didn't read the thin film. The species is told from the parasites inside intact red cells." },
        count: { delta: -15, note: "You didn't count the parasites. The density decides how sick the patient is and how they are treated." },
        more: { delta: -20, note: `You stopped searching early. A negative is only reported after ${g.fields_negative} thick-film fields.` },
      } },
    { id: "decide", name: "Decide", type: "talk", view: "bench", speaker: COLLEAGUE, say: "What are you reporting?", choices: decideChoices(st) },
  ];
  const d = v.decision;
  if (d === "pos") list.push({ id: "record", name: "Report it", type: "talk", view: "bench", speaker: COLLEAGUE, say: "Put it in ELIMS. How will the report read?", choices: [
    { text: `P. falciparum seen. ${D} asexual parasites/µL (thick film, against 200 white cells taken as ${n(g.wbc_assumed)}/µL).${CASES[st.case].thin.gams ? " Gametocytes seen." : ""}`, reply: "Good. Released to the ward." },
    { text: "Malaria parasites seen ++.", reply: "Hmm. Released.", delta: -10, note: "Report the species and the density in parasites/µL. A plus count can't be compared from one film to the next, so nobody can tell whether treatment is working." },
    { text: "Positive.", reply: "Hmm. Released.", delta: -15, note: "Positive for what, and how many? Report the species and the density." },
  ] });
  else if (d === "neg") list.push({ id: "record", name: "Report it", type: "talk", view: "bench", speaker: COLLEAGUE, say: "Put it in ELIMS. How will the report read?", choices: [
    { text: `No malaria parasites seen in ${g.fields_negative} thick-film fields. Note: the RDT can stay positive for several weeks after treatment (treated 16 days ago).`, reply: "Good. Released to the ward." },
    { text: "Negative.", reply: "Hmm. Released.", delta: -5, note: `Say how far you looked: "no malaria parasites seen in ${g.fields_negative} thick-film fields".` },
    { text: "No parasites seen, but the RDT was positive, so treat as malaria.", reply: "Hmm. Released.", delta: -20, note: "The film is the answer. The ward needs to know why the RDT is positive (recent treatment), not to be told to treat." },
  ] });
  else if (d === "severe") {
    const phone = { type: "talk", view: "phone", anchor: "phone" };
    list.push({ ...phone, id: "call", name: "Call the ward", speaker: `${P.sister} (${P.ward}, on the phone)`, say: `${P.ward}, ${P.sister} speaking.`, choices: [
      { text: `This is the lab with a critical result for ${P.name}, date of birth ${P.dob}, lab number ${P.lab}: P. falciparum, ${D} parasites per microlitre. That is a severe density. Please read it back, and tell the doctor now.`,
        reply: v.rbWrong ? `So that's ${P.name}, falciparum, thirty-two thousand five hundred per microlitre?` : `So that's ${P.name}, ${P.dob}, falciparum, ${D} per microlitre. I'll get the doctor.`, set: { asked: true } },
      { text: `${P.name} has heavy malaria. You might want to tell the doctor.`, reply: "Heavy? How heavy?", delta: -20,
        note: "Give the species and the density in parasites/µL, identify the patient properly, and ask for a read-back. 'Heavy' means nothing on a chart." },
      { text: "I'll put it in ELIMS, they'll see it.", reply: "(You hang up.)", delta: -30, critical: "Severe malaria must be phoned to someone who can act on it now, and read back. In ELIMS alone it may sit for hours." },
    ] });
    if (v.asked) list.push({ ...phone, id: "readback", name: "Read-back", speaker: `${P.sister} (${P.ward}, on the phone)`,
      say: v.rbWrong ? "...thirty-two thousand five hundred. Is that right?" : `...${D} per microlitre. Got it.`,
      choices: v.rbWrong ? [
        { text: `No: ${D}. Three hundred and twenty-five thousand per microlitre. Please read it back again.`, reply: `Sorry: ${D} per microlitre. I'm calling the doctor now.` },
        { text: "Yes, that's it. Thanks.", reply: "Thank you.", delta: -30, critical: `The read-back was ten times too low (32,500 instead of ${D}). At 32,500 nobody starts IV treatment. Correct it.` },
        { text: "Roughly, yes. It's high either way.", reply: "Okay...", delta: -30, critical: `The read-back was ten times too low (32,500 instead of ${D}). The treatment depends on the number. Correct it and ask again.` },
      ] : [
        { text: "That's correct. Can I take your name? I'll record that you received it, and the time.", reply: `${P.sister}. Thank you.` },
        { text: "That's right. Bye.", reply: "Bye.", delta: -10, note: "Record who took the result and when." },
      ] });
  }
  return list;
}

const CASE_NAME = { falciparum: "P. falciparum, routine density", severe: "P. falciparum, severe density", negative: "RDT positive, film negative" };
const subject = (st, P) => `${P.name} · malaria film, ${CASE_NAME[st.case]}`;

module.exports = {
  key: "mal-201",
  title: "MAL-201 · Malaria microscopy",
  description: "The RDT was positive and the ward wants a yes. Make thick and thin films, stain them, and read them under oil: find the parasites, tell the species, count the density. Report it properly, phone a severe one with read-back, or report a true negative after the full search. The case changes every run.",
  bay: "haematology",
  tourniquetLimit: 60,
  TUBES: {}, OBJECTS, NEUTRAL, PATIENTS, CASES, FORM_TESTS, ORDER_WHY: {},
  SETTINGS, steps, init, findings, specimen, subject, objects,
};
