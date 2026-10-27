// PHLEB-101 — venipuncture and patient identification, as a 3D practical.
//
// Everything a run needs to know is here: the patients who can turn up, the
// tubes on the rack and the order they are drawn in, and the eight steps with
// their right answers and what each mistake costs. The engine reads it; the
// browser only ever sees the parts it has to draw.

const TUBES = require("./tubes");

// Why the earlier tube must come first, keyed "earlier>later".
const ORDER_WHY = {
  "edta>fluoride": "Order of draw: purple (EDTA) comes before grey (fluoride oxalate), so the grey tube's additive cannot carry over into the blood count.",
  "citrate>sst": "Order of draw: light blue (citrate) comes before gold. Clot activator carried over from the gold tube starts clotting in the citrate tube and gives a falsely short PT.",
};

// What the learner sees when they point at something.
const OBJECTS = {
  sanitiser: ["Alcohol hand rub", "70% alcohol"],
  gloves: ["Nitrile gloves", "Box of 100, size M"],
  tourniquet: ["Tourniquet", "Quick-release"],
  swab: ["Alcohol swabs", "70% isopropyl"],
  needle: ["Needle and holder", "21G, single use"],
  cap: ["Needle cap", ""],
  gauze: ["Sterile gauze", "5 × 5 cm"],
  sharps: ["Sharps bin", "Needles go straight in"],
  printer: ["Label printer", "Prints the patient's tube labels"],
};
for (const k in TUBES) OBJECTS[k] = [`${TUBES[k].name} tube`, TUBES[k].add];

// Touching these at the wrong moment is harmless, so it costs nothing.
const NEUTRAL = ["sanitiser", "gloves", "printer"];

const PATIENTS = [
  { key: "ibrahim", name: "Ibrahim Kamara", title: "Mr Kamara", sex: "Male", female: false, dob: "14/05/1982", age: 44, lab: "LAB-2026-0892",
    clinic: "Outpatients (OPD)", doctor: "Dr F. Conteh", time: "08:40", greeting: "morning",
    tests: ["full blood count", "fasting glucose"], ticks: ["FBC", "FBG"], tubes: ["edta", "fluoride"], tubeTest: { edta: "FBC", fluoride: "FBG" },
    notes: "Fasting glucose. Pt told to fast from 9 pm.",
    greet: "Good morning! Here is my form from the doctor. I need to get to work soon, can we do this quickly?",
    ask: "and when you last ate or drank anything",
    reply: "Ibrahim Kamara, 14th May 1982. I haven't eaten since 9 last night, only plain water.",
    shortReply: "Ibrahim Kamara, 14th May 1982.",
    missCheck: "Fasting not checked. A fasting glucose from someone who has eaten reads high and misleads the doctor.",
    decoy: { name: "KAMARA, Ibrahim S.", dob: "03/11/1990", lab: "LAB-2026-0889", tube: "edta", test: "FBC" },
    look: { skin: "#6b4429", shirt: "#3a77a8", trousers: "#2d3436", hair: "short" } },
  { key: "mariama", name: "Mariama Sesay", title: "Mrs Sesay", sex: "Female", female: true, dob: "02/09/1971", age: 55, lab: "LAB-2026-0917",
    clinic: "Medical clinic", doctor: "Dr A. Bangura", time: "14:15", greeting: "afternoon",
    tests: ["PT/INR", "urea and electrolytes"], ticks: ["PT/INR", "U&E"], tubes: ["citrate", "sst"], tubeTest: { citrate: "PT/INR", sst: "U&E" },
    notes: "On warfarin 5 mg nocte. INR check, renal function.",
    greet: "Good afternoon. The doctor says I need my blood checked for the warfarin.",
    ask: "and which medicines you are taking",
    reply: "Mariama Sesay, 2nd September 1971. I take warfarin every evening, and my pressure tablets.",
    shortReply: "Mariama Sesay, 2nd September 1971.",
    missCheck: "Medicines not checked. She is on warfarin: that explains the INR request and means pressing on the site for longer.",
    decoy: { name: "SESAY, Mariatu", dob: "02/09/1977", lab: "LAB-2026-0911", tube: "sst", test: "U&E" },
    look: { skin: "#5a3822", shirt: "#b5482d", trousers: "#b5482d", hair: "headtie", print: "#f1c40f" } },
];

const crit = (reason, delta = -30) => ({ delta, critical: reason });

// The steps for one patient. Kinds: talk (choose what to say), seq (use these
// things in this order), draw (needle then tubes, in the order of draw), label.
function steps(P) {
  const his = P.female ? "her" : "his";
  return [
    { id: "id", name: "Identify", type: "talk", view: "patient", say: P.greet, choices: [
      { text: `Good ${P.greeting}! For your safety, please tell me your full name, your date of birth, ${P.ask}.`, reply: P.reply },
      { text: `Good ${P.greeting} ${P.title}! Have a seat and roll up your sleeve so we can get you out quickly.`, reply: "Okay, my sleeve is up.",
        ...crit("Passive identification. You read the name off the form instead of asking the patient to state it. A patient who hears a name often just agrees.", -25) },
      { text: `You're ${P.name}, born ${P.dob}, yes?`, reply: "Yes, yes, that's me.",
        ...crit("Leading question. Reading the details out and asking for a yes lets the wrong patient agree. Ask them to state their name and date of birth.", -25) },
      { text: "Please state your full name and date of birth.", reply: P.shortReply, delta: -10, note: P.missCheck },
    ] },
    { id: "consent", name: "Consent", type: "talk", view: "patient", say: "Will it hurt? I don't like needles.", choices: [
      { text: "You'll feel a small sharp scratch, and it's over in about a minute. Is it alright if I go ahead?", reply: "Okay. Go ahead." },
      { text: "It doesn't hurt at all, don't worry.", reply: "If you say so...", delta: -5, note: "Don't promise it won't hurt. Tell the patient what to expect, so they trust you." },
      { text: "Just relax and look the other way.", reply: "Oh. Alright then.", delta: -10, note: "No consent asked. Explain what you will do and get the patient's agreement before you touch them." },
    ] },
    { id: "ppe", name: "Hands & gloves", type: "seq", view: "bench", task: "Clean your hands, then put on gloves.", need: ["sanitiser", "gloves"],
      order: { gloves: { delta: -10, note: "Gloves go on clean hands. Use the hand rub first." } },
      wrong: {
        tourniquet: crit("You picked up the tourniquet before cleaning your hands and putting on gloves."),
        swab: crit("You picked up the alcohol swab before cleaning your hands and putting on gloves."),
        needle: crit("You handled the needle without gloves on."),
      } },
    { id: "site", name: "Prepare site", type: "seq", view: "wide", task: `Apply the tourniquet to ${his} left arm, then clean the site.`, need: ["tourniquet", "swab"],
      order: { swab: { delta: -5, note: "Apply the tourniquet first to find the vein, then clean the site and let it dry." } },
      wrong: { needle: { delta: -15, note: "The tourniquet goes on and the site is cleaned before the needle goes in." } } },
    { id: "draw", name: "Draw", type: "draw", view: "bench", task: `Insert the needle, then fill the tubes for the ${P.tests.join(" and the ")}.` },
    { id: "after", name: "Finish draw", type: "seq", view: "wide", task: "Release the tourniquet, withdraw the needle into the sharps bin, then press gauze on the site.", need: ["tourniquet", "sharps", "gauze"],
      order: { sharps: { delta: -15, note: "Release the tourniquet before you withdraw the needle, or blood is pushed out around it and a bruise forms." },
               gauze: { delta: -5, note: "Withdraw the needle first, then press the gauze on the site." } },
      wrong: { cap: crit("You recapped a used needle. Recapping causes most needlestick injuries. Drop it straight into the sharps bin.") },
      info: { needle: "To withdraw the needle, drop it straight into the sharps bin." } },
    { id: "leave", name: "Before leaving", type: "talk", view: "patient", say: "That wasn't too bad! Am I free to go now?", choices: [
      { text: "Please stay seated one more minute while I label your tubes here in front of you.", reply: "Of course." },
      { text: "Yes, all done. Have a good day!", reply: "Thank you, bye!", leaves: true,
        ...crit("The patient left before the tubes were labelled. Label at the chair, in front of the patient, every time.") },
      { text: "Wait in the corridor, and I'll call you if there's a problem.", reply: "Alright...", leaves: true, delta: -15,
        note: "Label with the patient still in the chair, so you can check each label against them." },
    ] },
    { id: "label", name: "Label", type: "label", view: "rack", task: "Label both tubes. Pick a label, then the tube it belongs on. Check each one against the request form." },
  ];
}

module.exports = {
  key: "phleb-101",
  title: "PHLEB-101 · Venipuncture and patient ID",
  description: "Phlebotomy bay: identify the patient, consent, hand hygiene, order of draw, sharps, and labelling at the chair. Two patients, picked at random.",
  bay: "phlebotomy",
  tourniquetLimit: 60,
  TUBES, ORDER_WHY, OBJECTS, NEUTRAL, PATIENTS, steps,
};
