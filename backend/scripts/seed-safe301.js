// Seed SAFE-301 — blood spill — a course that ends in the 3D spill practical.
//
//   node -r dotenv/config scripts/seed-safe301.js            # create it if missing
//   node -r dotenv/config scripts/seed-safe301.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "SAFE-301 Blood spill";

const LESSONS = [
  ["Before you touch it", `A tube smashes on the floor. Nobody is hurt yet. What happens in the next minute decides whether anybody will be.

## Every spill is infectious
Treat every blood spill as if it carries HIV, hepatitis B and hepatitis C (**standard precautions**). A negative test result doesn't change this: tests miss early infection (the window period), and blood carries more than the three things we test for.

## People first
If blood has reached a person (splashed in an eye or mouth, onto broken skin, or a cut from the glass), **first aid comes before the spill**. See lesson 3.

## Make it safe
1. **Stop**, and keep everyone back. Nobody wipes it with a paper towel: that spreads it, and pushes glass into the hand.
2. Put the **warning sign** out by the spill.
3. Fetch the **spill kit**.

## Protect yourself
Before you go near it: **gloves**, a **plastic apron**, and **eye protection**. A spill can splash while it is being covered.

## Never touch broken glass
Not with your hands, not even gloved. Glass comes up with the **forceps and scoop** from the kit, and goes straight into the **sharps bin**.`],
  ["Cover, disinfect, wait, clear", `## Cover, then disinfect
1. Cover the spill with **absorbent paper**.
2. Pour disinfectant **over the paper**, working from the **edges inwards**. Poured onto a bare spill, it splashes blood about.

## The right disinfectant
| Solution | Use it for |
|---|---|
| **Hypochlorite 0.5–1%** (5,000–10,000 ppm available chlorine) | **Blood spills** |
| Hypochlorite 0.1% (1,000 ppm) | Routine cleaning of clean surfaces. Too weak for blood: the protein uses it up |
| Alcohol 70% | Not for spills: it fixes protein to the surface and evaporates before it has worked |

Diluted hypochlorite loses strength: make it up fresh each day, and label it with the strength and the date.

## Wait
Leave the disinfectant for its **full contact time: 30 minutes**, with the sign still out. Nothing makes it work faster.

## Clear it away
1. Glass: **forceps and scoop**, into the **sharps bin**.
2. Paper, gloves and apron: into the **yellow clinical-waste bag**. Never glass in a bag: it cuts through, into whoever carries it.
3. **Wipe the area again** with fresh disinfectant.
4. **Wash your hands** with soap and water.

## Report it
Every spill goes on the incident form, the same day, even when nobody is hurt. The log is how repeat causes get found, and how the spill kit gets restocked.`],
  ["When blood reaches a person", `## First aid, at once
- **Eye**: go to the eyewash and flush it with running water for **at least 15 minutes**. Don't rub it.
- **Mouth**: spit, and rinse with water several times.
- **Broken skin or a cut**: let it bleed gently, wash with soap and running water. Don't scrub, and don't put disinfectant or bleach on skin.

## Then report it, straight away
An exposure is reported **at once**, not at the end of the shift:
- Tell the lab manager, and go to the staff clinic (or whoever covers occupational exposure) **now**.
- **Post-exposure treatment (PEP) for HIV works best started within hours**, and is not started after **72 hours**.
- Keep the **source patient's sample**: it can be tested with consent.
- Your hepatitis B vaccination status matters: know it.

## Then the spill
While the person is at the eyewash, keep everyone back with the sign. The spill waits; the person doesn't.`],
];

const QUESTIONS = [
  ["A colleague drops a tube from a patient who tested HIV and hepatitis B negative this morning. How is the spill handled?", ["With a paper towel: the sample is negative", "Like any blood spill: spill kit, PPE, hypochlorite", "With 70% alcohol spray"], 1],
  ["Which solution is used on a blood spill?", ["Hypochlorite 0.1% (1,000 ppm)", "Alcohol 70%", "Hypochlorite 0.5–1% (5,000–10,000 ppm)"], 2],
  ["How is broken glass in a blood spill picked up?", ["With forceps and a scoop, into the sharps bin", "Carefully by hand, wearing gloves", "Wrapped in the paper towels, into the waste bag"], 0],
  ["Blood splashes into a colleague's eye. What comes first?", ["Clean up the spill before it spreads", "Flush the eye at the eyewash for at least 15 minutes", "Fill in the incident form"], 1],
  ["After a blood splash to the eye, when is it reported?", ["At once: post-exposure treatment works best started within hours", "At the end of the shift", "Only if the source patient is known to be positive"], 0],
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
     VALUES ($1,$2,$3,'Biosafety','published',80,24,0,TRUE,TRUE,'on_pass','safe-301',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "A tube smashes on the lab floor. Keep people back, protect yourself, disinfect it with the right solution, give it time, clear the glass without touching it, and report it; and when blood reaches a person, put them first. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical safe-301`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
