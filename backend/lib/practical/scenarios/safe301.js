// SAFE-301 — a blood spill, as a 3D practical.
//
// A tube smashes on the chemistry lab floor. The learner keeps people away,
// opens the spill kit, puts on PPE, covers the spill and pours the right
// disinfectant over it, waits out the contact time, clears the glass with
// forceps (never hands) into the sharps bin, bags the waste, wipes again, washes
// and reports it.
//
// What happens first is dealt at random, so the opening move has to be thought
// about: a plain spill; a colleague who says the sample was negative so a paper
// towel will do; or blood splashed into the colleague's eye, where the person
// comes before the floor and the report becomes urgent.
//
// Lab to confirm: hypochlorite strength (1% and 0.5% are both accepted here;
// 0.1%, the routine surface dilution, is not), the 30-minute contact time, and
// the PEP wording.

const COLLEAGUE = "Mr Kallon (senior scientist)";
const MANAGER = "Mrs Jalloh (lab manager, on the phone)";
const CONTACT_MIN = 30;

const OBJECTS = {
  spill: ["The spill", "A broken blood tube on the floor"],
  sign: ["Warning sign", "Biohazard: keep clear"],
  spillkit: ["Spill kit", "Biohazard spill kit"],
  gloves: ["Gloves", "Nitrile, box of 100"],
  apron: ["Plastic apron", ""],
  goggles: ["Eye protection", "Goggles"],
  paper: ["Absorbent paper", "Paper towels and pads"],
  bleach1: ["Hypochlorite 1%", "Sodium hypochlorite, 10,000 ppm. Made up today"],
  bleach05: ["Hypochlorite 0.5%", "Sodium hypochlorite, 5,000 ppm. Made up today"],
  bleach01: ["Hypochlorite 0.1%", "Sodium hypochlorite, 1,000 ppm. Made up today"],
  alcohol: ["Alcohol 70%", "Spray bottle"],
  forceps: ["Forceps and scoop", "For broken glass"],
  sharps: ["Sharps bin", ""],
  biobag: ["Clinical waste bin", "Yellow bag: infectious waste"],
  sink: ["Hand basin", "Soap and water. The eyewash is beside it"],
  // the rest of the chemistry lab
  analyser: ["Chemistry analyser", ""], tube: ["Sample rack", ""], qcvials: ["QC material", ""], qc: ["QC chart", ""],
  terminal: ["ELIMS terminal", ""], phone: ["Phone", ""], centrifuge: ["Centrifuge", ""], fridge: ["Reagent fridge", ""],
};
const NEUTRAL = ["analyser", "tube", "qcvials", "qc", "terminal", "phone", "centrifuge", "fridge"];

// The person in the room is the colleague who dropped it.
const LAB_COAT = { skin: "#4e301d", shirt: "#f4f6f7", trousers: "#2c3e50", hair: "short" };
const PATIENTS = [
  { key: "kallon", name: "Mr Kallon", female: false, sex: "Male", look: LAB_COAT, tests: ["Blood spill"], ticks: [], ward: "Chemistry lab" },
];

const CASES = ["floor", "negative", "splash"];
function init(st, P, rnd = Math.random) {
  st.case = CASES[Math.floor(rnd() * CASES.length)];
}

const HANDS = "Never touch a spill or broken glass with your hands, even gloved. Glass goes with the forceps and scoop.";
const WEAK = {
  bleach01: { delta: -25, what: "Reached for the 0.1% hypochlorite",
    note: "0.1% (1,000 ppm) is the routine dilution for clean surfaces. Blood carries enough protein to use it up: a blood spill needs 0.5–1% (5,000–10,000 ppm)." },
  alcohol: { delta: -25, what: "Reached for the alcohol",
    note: "Alcohol is not for blood spills: it fixes protein to the surface and evaporates before it has worked. Use hypochlorite at 0.5–1%." },
};
const STRONG = { bleach1: "bleach", bleach05: "bleach" };

function alert(st) {
  const go = "Stop, don't touch it. Keep everyone back: I'll put the sign out and get the spill kit.";
  if (st.case === "splash") return {
    say: "Ah! The tube smashed and blood's splashed in my eye!",
    choices: [
      { text: "Go to the eyewash now and flush that eye for at least 15 minutes. I'll keep people away from the spill. Then we report it straight away: you may need post-exposure treatment.", reply: "Okay. Going." },
      { text: "Dab it with a tissue for now, then help me clean this up.", reply: "Er... okay.", delta: -30,
        critical: "The person comes before the spill. A splash in the eye is an exposure: flush it at the eyewash at once, for at least 15 minutes, then report it." },
      { text: "Let's get the spill cleaned up first, then you can wash it.", reply: "Are you sure?", delta: -30,
        critical: "Every minute blood sits in an eye raises the risk of infection. First aid first: the eyewash, at least 15 minutes. The spill can wait behind a sign." },
    ] };
  if (st.case === "negative") return {
    say: "Sorry, I dropped a tube. It's only from the patient this morning, HIV and hepatitis B negative. A paper towel and some water will do.",
    choices: [
      { text: `Treat it like any other blood spill. A negative test doesn't rule out infection, and it isn't the only thing in blood. ${go}`, reply: "Fair enough. I'll stay back." },
      { text: "If it's negative, a paper towel's fine. Mind the glass.", reply: "Right.", delta: -20,
        note: "Every blood spill is handled as infectious (standard precautions). A test can be negative in the window period, and blood carries more than HIV and hepatitis B." },
      { text: "Okay, but use alcohol instead of water.", reply: "Okay.", delta: -15,
        note: "Every blood spill is handled as infectious, with the spill kit. Alcohol isn't a spill disinfectant: hypochlorite at 0.5–1% is." },
    ] };
  return {
    say: "Oops! I've dropped a tube, it's smashed all over the floor. I'll grab some paper towels and wipe it up quickly.",
    choices: [
      { text: go, reply: "Okay, I'll stay back." },
      { text: "Okay, but put gloves on first.", reply: "Will do.", delta: -15,
        note: "A paper-towel wipe spreads the blood and pushes glass into the towel and the hand. Spills are cleaned with the spill kit: PPE, cover, disinfect, wait, then clear." },
      { text: "Just pick the big bits of glass up first, then wipe.", reply: "With my hands?", delta: -30,
        critical: `Broken glass covered in blood is a sharps injury waiting to happen. ${HANDS}` },
    ] };
}

function report(st) {
  if (st.case === "splash") return [
    { text: "A tube broke in chemistry and splashed blood into Mr Kallon's eye. He flushed it at the eyewash for 15 minutes. He needs a post-exposure assessment now, and the source patient's sample should be kept for testing. The spill is cleaned; I'll write up the incident.",
      reply: "Thank you. I'll send him to the staff clinic now." },
    { text: "The spill's cleaned up. Mr Kallon got a splash, but he's rinsed it. He's fine.", reply: "Okay...", delta: -30,
      critical: "A blood splash in the eye is an exposure, and must be reported at once. Post-exposure treatment for HIV works best started within hours, and no later than 72 hours." },
    { text: "Nothing to report. It's all cleaned up.", reply: "Okay.", delta: -30,
      critical: "A blood splash in the eye is an exposure, and must be reported at once. Post-exposure treatment for HIV works best started within hours, and no later than 72 hours." },
  ];
  return [
    { text: "A blood tube broke on the floor in chemistry. We kept the area clear, disinfected it with hypochlorite and cleared it with the spill kit. Nobody was hurt. I'll fill in the incident form now.",
      reply: "Thanks. Leave the form on my desk, and restock the spill kit." },
    { text: "It's all cleaned up. Nothing to report.", reply: "Okay.", delta: -15,
      note: "Report every spill, even when nobody is hurt. The incident log is how repeat causes (a cracked rack, an overfull tray) get found and fixed, and how the spill kit gets restocked." },
    { text: "I'll mention it at the next staff meeting.", reply: "When's that?", delta: -10,
      note: "Report it today, on the incident form. A meeting next week is not a record." },
  ];
}

function steps(P, st = {}) {
  const a = alert(st);
  const info = { spill: HANDS, spillkit: "The spill kit is open. What you need is on the trolley." };
  return [
    { id: "alert", name: "It's broken", type: "talk", view: "room", speaker: COLLEAGUE, say: a.say, choices: a.choices },
    { id: "secure", name: "Make it safe", type: "seq", view: "room",
      task: "Keep people away from the spill: put the warning sign out by it. Then open the spill kit on the trolley.",
      need: ["sign", "spillkit"], info: { spill: HANDS },
      did: { sign: "Put the warning sign out by the spill", spillkit: "Opened the spill kit" },
      order: { spillkit: { delta: -5, note: "Put the sign out first: someone walking through it spreads it and can slip on the glass." } } },
    { id: "ppe", name: "PPE", type: "seq", view: "work", any: true,
      task: "Put on your protection before you go near it: gloves, apron and eye protection.",
      need: ["gloves", "apron", "goggles"], info,
      did: { gloves: "Put on gloves", apron: "Put on a plastic apron", goggles: "Put on eye protection" },
      wrong: { paper: { delta: -10, what: "Went for the spill before PPE", note: "Gloves, apron and eye protection first. A spill can splash as it's covered." },
        forceps: { delta: -10, what: "Went for the glass before PPE", note: "Gloves, apron and eye protection first." } } },
    { id: "contain", name: "Cover and disinfect", type: "seq", view: "work",
      task: "Cover the spill with absorbent paper, then pour disinfectant over the paper, from the edges inwards.",
      need: ["paper", "bleach"], alt: STRONG, info,
      did: { paper: "Covered the spill with absorbent paper", bleach1: "Poured hypochlorite 1% over the paper, edges inwards", bleach05: "Poured hypochlorite 0.5% over the paper, edges inwards" },
      order: { bleach: { delta: -10, note: "Cover it with paper first, then pour the disinfectant over the paper. Poured straight onto a bare spill, it splashes blood about." } },
      wrong: { ...WEAK, forceps: { delta: -10, what: "Went for the glass before disinfecting", note: "Cover and disinfect first, and let it work. The glass comes out once the contact time is up." } } },
    { id: "wait", name: "Contact time", type: "talk", view: "spill", speaker: COLLEAGUE,
      say: st.case === "splash" ? "Eye's done, fifteen minutes at the eyewash. Can we clear that up now? The analyser's waiting." : "It's been a couple of minutes. Can we clear it up now? The analyser's waiting.",
      choices: [
        { text: `Not yet. The disinfectant needs its full contact time: ${CONTACT_MIN} minutes. The sign stays out until then.`, reply: `(${CONTACT_MIN} minutes later) Right, that's ${CONTACT_MIN} minutes.` },
        { text: "Yes, it's had a couple of minutes. That'll do.", reply: "Great.", delta: -20,
          note: `Disinfectant only works with time. Clearing it after two minutes leaves live virus on the glass and the floor. Wait the full ${CONTACT_MIN} minutes.` },
        { text: "Let's spray some alcohol on top to speed it up.", reply: "Will that work?", delta: -15,
          note: `Nothing speeds it up. Alcohol doesn't work on a blood spill, and it dilutes the hypochlorite. Wait the full ${CONTACT_MIN} minutes.` },
      ] },
    { id: "clear", name: "Clear it", type: "seq", view: "work",
      task: "Clear it away: the glass with the forceps and scoop into the sharps bin, the paper and your gloves and apron into the clinical waste. Wipe the area again with disinfectant, then wash your hands.",
      need: ["forceps", "sharps", "biobag", "bleach", "sink"], alt: STRONG, info,
      did: { forceps: "Picked up the glass with the forceps and scoop", sharps: "Put the glass in the sharps bin", biobag: "Put the paper, gloves and apron in the yellow clinical-waste bag",
        bleach1: "Wiped the area again with hypochlorite 1%", bleach05: "Wiped the area again with hypochlorite 0.5%", sink: "Washed hands with soap and water" },
      order: {
        sharps: { delta: -5, note: "Pick the glass up with the forceps and scoop first; it goes in the sharps bin from the scoop." },
        biobag: { delta: -10, note: "Glass first, into the sharps bin. Glass in a waste bag cuts through it, and into whoever carries it." },
        bleach: { delta: -5, note: "Clear the glass and paper away first, then wipe the area again." },
        sink: { delta: -5, note: "Finish clearing up first, then wash your hands." },
      },
      wrong: { ...WEAK } },
    { id: "report", name: "Report it", type: "talk", view: "phone", anchor: "phone", speaker: MANAGER,
      say: "Lab manager. What's happened?", choices: report(st) },
  ];
}

// What the bay draws: what has been used so far.
function specimen(st) { return { used: st.used || [] }; }

const CASE_NAME = { floor: "a tube on the floor", negative: "\"it's only a negative\"", splash: "a splash in the eye" };
const subject = (st) => `Blood spill, chemistry lab · ${CASE_NAME[st.case]}`;

module.exports = {
  key: "safe-301",
  title: "SAFE-301 · Blood spill",
  description: "A tube smashes on the lab floor. Keep people back, open the spill kit, put on PPE, cover it and pour the right disinfectant, wait out the contact time, clear the glass without touching it, and report it. Sometimes a colleague has blood in the eye, and the person comes first.",
  bay: "spill",
  tourniquetLimit: 60,
  TUBES: {}, OBJECTS, NEUTRAL, PATIENTS, ORDER_WHY: {},
  steps, init, specimen, subject, CONTACT_MIN,
};
