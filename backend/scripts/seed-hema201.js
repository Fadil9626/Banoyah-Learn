// Seed HEMA-201 — low platelets — a course that ends in the 3D haematology
// practical at the microscope.
//
//   node -r dotenv/config scripts/seed-hema201.js            # create it if missing
//   node -r dotenv/config scripts/seed-hema201.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "HEMA-201 Low platelets";

const LESSONS = [
  ["Is the count real?", `A platelet count of 18 ×10⁹/L can mean a patient at risk of bleeding. It can also be completely false. Before it leaves the lab, check.

## The sample
Check every low platelet count for **clots**: run two applicator sticks round the tube, and watch it mix. Even a small clot uses up platelets, and spoils the rest of the count too.

## The full count and its flags
Read the whole count, not only the platelets. Analysers flag what they can't count properly: **"PLT clumps?"** is a warning in itself. A missing MPV often goes with it.

## Today's QC
If today's platelet QC is out, no count from that run can be trusted.

## The history
ELIMS shows earlier counts. A count that has fallen from 88 to 41 to 18 over three days is believable. One that was 262 three weeks ago, in a well patient booked for surgery, needs explaining.

## Then look at a film
The film is what settles it. Re-running the same tube only gives the same number again.`],
  ["Making and reading the film", `## Making it
1. **Mix** the sample by gentle inversion, 8 to 10 times. Cells settle within minutes.
2. Put a small drop near one end of a clean slide. Hold the **spreader at 30–45°**, draw it back into the drop, and push forward in **one smooth movement**.
3. Let it **air-dry**, then **stain** it (Leishman here; follow your SOP), and rinse in buffer at pH 6.8.

A good film has a **body**, where the cells just touch, and a thin **feathered edge** at the end.

## Reading it, under oil (×100)
- **The feathered edge.** As the film is spread, big things are pushed to its thin end: **platelet clumps collect there**. Always look at it when the count is low.
- **The body.** Look for clumps here too, and count single platelets.

## Estimating the count
Count single platelets in 10 oil fields in the body and take the average. Each platelet per field is roughly **15 ×10⁹/L** (your lab may use a slightly different factor). An average of 1.2 is about 18; an average of 4 is about 60.

| What you see | What it means |
|---|---|
| Few platelets, no clumps, estimate agrees with the analyser | A **real** low count |
| Clumps, especially at the feathered edge; clean tube | **EDTA-induced clumping**: the count is false |
| Clumps **and fibrin strands**; clot in the tube | A **partly clotted** sample: the whole count is unreliable |`],
  ["Acting on it", `## A real low count
Below **20 ×10⁹/L** is a critical result here: phone it at once to the nurse caring for the patient or the doctor, never as a message.
- Identify the patient by **name, date of birth and lab number**.
- Ask for a **read-back**, and listen to it. "Eighteen" heard as "eighty" is the classic mistake: at 80 nobody acts.
- Record who took it, and when.

## Clumping in EDTA
Some people's platelets clump in EDTA (pseudothrombocytopenia). It is harmless in itself, but a false count of 18 can get a patient a transfusion they don't need, or their operation cancelled.
- **Don't report the count.** Comment that platelets are clumped.
- Ask for a **light-blue citrate tube**: platelets usually stay apart in citrate. Another purple tube will clump again.

## A clotted sample
**Reject it.** Ask for a new EDTA sample, mixed gently straight after filling. Tell the ward why.

## Never give out a number you believe is false
Not even "with a warning". Say it can't be reported, why, and what you need.`],
];

const QUESTIONS = [
  ["The analyser reports platelets 18 with the flag \"PLT clumps?\". The tube has no clot. Where on the film do clumps collect?", ["In the middle of the body", "At the feathered edge", "Only at the very start of the film"], 1],
  ["The film shows platelet clumps; the tube has no clot. What do you ask the ward for?", ["Another EDTA (purple) tube", "A citrate (light blue) tube for the platelet count", "Nothing: report 18"], 1],
  ["An average of 4 single platelets per oil field is roughly:", ["4 ×10⁹/L", "18 ×10⁹/L", "60 ×10⁹/L"], 2],
  ["A small clot comes out on the applicator stick. What happens to the FBC?", ["Report everything except the platelets", "Reject it and ask for a new EDTA sample", "Re-run it on the analyser"], 1],
  ["You phone platelets 18 and the nurse reads back \"eighty\". What do you do?", ["Correct it: eighteen, one-eight, and ask for another read-back", "Accept it: both are low", "Hang up and put it in ELIMS"], 0],
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
     VALUES ($1,$2,$3,'Haematology','published',80,24,0,TRUE,TRUE,'on_pass','hema-201',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "The analyser reports platelets 18. Check the sample, the count and the QC, make and stain a film, and look at it under oil: clumps, a clot, or a real low count. Then phone a real critical with a read-back, or stop a false one. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical hema-201`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
