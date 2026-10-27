// Seed PHLEB-101 — venipuncture and patient identification — the first course
// that ends in a 3D practical.
//
//   node -r dotenv/config scripts/seed-phleb101.js            # create it if missing
//   node -r dotenv/config scripts/seed-phleb101.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "PHLEB-101 Venipuncture and patient identification";

const LESSONS = [
  ["Identify the patient", `Wrong-blood-in-tube starts at the chair. Most mislabelled samples come from a patient who was never properly identified.

## Two identifiers, stated by the patient
Ask the patient to **state** their full name and date of birth, then compare both with the request form.

- Do **not** read the name out and ask "is that you?". Anxious, deaf or confused patients say yes to almost anything.
- Do **not** rely on a clinic card or a name you overheard in the waiting area.
- If anything differs, stop. Sort it out with the requesting clinic before you draw.

## Check what the test needs
- **Fasting glucose**: ask when they last ate or drank anything other than water.
- **INR**: ask about warfarin and other blood thinners. It explains the request and means pressing longer on the site afterwards.

## Consent
Tell the patient what you are going to do and that they will feel a sharp scratch. Ask if it is alright to go ahead. Never promise it will not hurt.`],
  ["Hand hygiene, tourniquet and the order of draw", `## Before you touch the patient
1. Clean your hands with alcohol rub.
2. Put on gloves.

Touching the tourniquet, swab or needle before this is a critical safety failure.

## The tourniquet
Apply it 7–10 cm above the site, find the vein, then clean the site with a 70% alcohol swab and **let it dry**. Keep the tourniquet on for **under one minute**. Longer and the blood concentrates: potassium, proteins and cell counts read falsely high. Release it as soon as blood is flowing into the first tube.

## Order of draw (CLSI)
| Order | Cap | Additive | Used for |
|---|---|---|---|
| 1 | Light blue | Sodium citrate | PT/INR, APTT |
| 2 | Red | None | Serology, blood grouping |
| 3 | Gold | Clot activator + gel | Chemistry (U&E, LFT) |
| 4 | Green | Lithium heparin | Plasma chemistry |
| 5 | Purple | K2-EDTA | Full blood count |
| 6 | Grey | Fluoride oxalate | Glucose |

The order stops one tube's additive carrying over into the next. Clot activator in a citrate tube shortens the PT; EDTA carried into a chemistry tube raises potassium and lowers calcium.`],
  ["Sharps, labelling and letting the patient go", `## Finishing the draw
1. Release the tourniquet (if it is still on).
2. Withdraw the needle and drop it **straight into the sharps bin**. Never recap a used needle: recapping causes most needlestick injuries.
3. Press gauze on the site. Patients on warfarin need longer.

## Label at the chair
Label every tube **in front of the patient, before they leave**. Check each label against the request form and against the patient:

- full name and date of birth
- lab number
- the right test on the right tube

Watch for **look-alike names** on the printer: a label left from the previous patient is the classic wrong-blood-in-tube error.

Only once every tube is labelled and checked does the patient go.`],
];

const QUESTIONS = [
  ["A request for FBC and fasting glucose. Which tube do you fill first?", ["Purple (EDTA), then grey (fluoride)", "Grey (fluoride), then purple (EDTA)", "Either order is fine"], 0],
  ["How do you identify an outpatient?", ["Read the name on the form and ask them to confirm", "Ask them to state their full name and date of birth", "Check the name on their clinic card"], 1],
  ["When are the tubes labelled?", ["Back at the bench, in a batch", "Before the draw, at the start of the shift", "At the chair, in front of the patient, before they leave"], 2],
  ["How long can the tourniquet stay on?", ["Up to one minute", "Up to three minutes", "Until every tube is full"], 0],
  ["What happens to the used needle?", ["Recap it, then put it in the sharps bin", "Straight into the sharps bin, uncapped", "Lay it on the tray until you finish"], 1],
];

async function main() {
  const replace = process.argv.includes("--replace");
  const admin = (await pool.query("SELECT id, org_id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1")).rows[0];
  if (!admin) throw new Error("No admin user found — bootstrap the org first.");
  const existing = (await pool.query("SELECT id FROM courses WHERE org_id=$1 AND title=$2", [admin.org_id, TITLE])).rows[0];
  if (existing && !replace) { console.log(`✓ already there (course ${existing.id}). Pass --replace to recreate it.`); return; }
  if (existing) await pool.query("DELETE FROM courses WHERE id=$1", [existing.id]);

  const course = (await pool.query(
    `INSERT INTO courses (org_id, title, description, category, status, pass_mark, validity_months,
                          max_attempts, shuffle_questions, shuffle_options, reveal_answers,
                          practical_key, practical_pass_mark, practical_weight, final_pass_mark, created_by)
     VALUES ($1,$2,$3,'Phlebotomy & Reception','published',80,24,0,TRUE,TRUE,'on_pass','phleb-101',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "Identify the patient, draw in the right order, and label at the chair. Study the three lessons, pass the quiz, then take the 3D practical in the phlebotomy bay. The certificate comes from the practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical phleb-101`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
