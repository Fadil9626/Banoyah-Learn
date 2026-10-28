// Seed CHEM-202 — critical potassium — a course that ends in the 3D chemistry
// bench practical.
//
//   node -r dotenv/config scripts/seed-chem202.js            # create it if missing
//   node -r dotenv/config scripts/seed-chem202.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "CHEM-202 Critical potassium";

const LESSONS = [
  ["Is it real? Check before you call", `A potassium of 7.8 mmol/L can stop a heart. It can also be completely false. Before a critical result leaves the lab, take two minutes to check three things.

## 1. The sample
Look at the serum, and read the serum indices the analyser reports.
- **Clear, straw-coloured** serum: fine.
- **Pink to red** serum, or an **H-index above about 100**: the sample is **haemolysed**. Red cells hold about 25 times more potassium than plasma; when they burst, the potassium reads falsely high.

## 2. The full panel
Read every result on the sample, not only the flagged one.
- **High potassium with very low calcium and very low ALP** is the pattern of **K-EDTA contamination**. EDTA (the purple tube) is a potassium salt; it also binds calcium, and the zinc and magnesium ALP needs. It happens when the purple tube is filled before the gold, or blood is poured from one tube into another.
- **High potassium with high urea and creatinine, low bicarbonate**, in a patient with kidney disease or on ACE inhibitors or spironolactone, fits a **real** hyperkalaemia.

## 3. Today's QC
If today's potassium QC is out, no result from that run can be trusted, high or low.

## And the history
ELIMS shows earlier results. A potassium that has climbed from 5.6 to 6.4 to 7.8 over three days is believable. One that was 4.3 two days ago, with normal kidneys, needs a very good explanation.`],
  ["Reading the QC chart", `Each analyser run includes control material of known value, plotted on a **Levey-Jennings chart**: the target in the middle, lines at ±1, ±2 and ±3 standard deviations (SD).

| What you see | Westgard rule | What it means |
|---|---|---|
| One point beyond ±2 SD | 1-2s | A warning: look at the other rules |
| One point beyond ±3 SD | **1-3s** | **Reject the run** |
| Two points in a row beyond the same 2 SD line | 2-2s | Reject the run: a systematic shift |
| One level above +2 SD and the other below −2 SD | R-4s | Reject the run: random error |

## When the QC fails
1. **Hold** every result from that run. Nothing is released, critical or not.
2. Run **fresh QC material** (and recalibrate if the fresh QC is also out).
3. Once the QC is back in control, **re-run the patient samples**, then release.

A critical result from a failed run is re-run first. It is quick, and it is the only way to know the number is right.`],
  ["Phoning a critical result", `A confirmed critical result is **phoned at once**, never batched, never left in ELIMS for someone to notice.

## Speak to someone who can act
Give the result to the **nurse looking after the patient or the doctor**. Not to a ward clerk, porter or student, and never as a message.

## Identify the patient properly
Name, **date of birth** and **lab number**. Never "bed 4": beds change.

## Ask for a read-back, and listen to it
> "Mariatu Sesay, date of birth 12 April 1958, lab number LAB-2026-1731: potassium 7.8 mmol/L. That's a critical result. Please read it back to me."

Listen. "7.8" heard as "8.7" changes the treatment. If the read-back is wrong, **correct it and ask again**.

## Record it
Who took the result, and when. The record is the proof that the result reached someone who could act on it.

## When the result is false
Do not phone the number "with a warning": someone may treat it. Say the result **can't be reported**, why, and ask for a recollection, with what to do differently:
- Haemolysed: a gentle draw, no shaking, no forcing blood through a narrow needle.
- EDTA contamination: fill the gold tube before the purple; never pour from one tube into another.`],
];

const QUESTIONS = [
  ["A potassium of 7.8 comes with an H-index of 380 and pink serum. What do you do?", ["Phone it as a critical result", "Don't report it: it is haemolysed; ask for a recollection", "Report it with the comment \"may be haemolysed\""], 1],
  ["Potassium 7.8, calcium 0.62, ALP 9, clear serum. What is the most likely cause?", ["K-EDTA contamination", "Acute kidney injury", "Haemolysis"], 0],
  ["Today's level 2 potassium QC is at +3.3 SD. What happens to a critical potassium from that run?", ["Phone it now and re-run later", "Release it: critical results are urgent", "Hold it, bring the QC back into control, re-run the sample, then report"], 2],
  ["Who do you give a critical result to?", ["Whoever answers the ward phone", "The nurse caring for the patient, or the doctor", "The ward clerk, as a message"], 1],
  ["The nurse reads back \"potassium 8.7\" for a result of 7.8. What do you do?", ["Accept it: both are critical", "Correct it and ask for another read-back", "Hang up and post it in ELIMS"], 1],
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
     VALUES ($1,$2,$3,'Clinical chemistry','published',80,24,0,TRUE,TRUE,'on_pass','chem-202',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "The analyser flags a critical potassium. Check the sample, the full panel and the QC before it goes anywhere; phone a real critical with a read-back, and stop a false one. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical chem-202`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
