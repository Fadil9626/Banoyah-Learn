// Seed MAL-201 — malaria microscopy — a course that ends in the 3D practical at
// the haematology bench.
//
//   node -r dotenv/config scripts/seed-mal201.js            # create it if missing
//   node -r dotenv/config scripts/seed-mal201.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "MAL-201 Malaria microscopy";

const LESSONS = [
  ["The film, not just the RDT", `A rapid diagnostic test (RDT) is quick and useful, but it can't answer the questions treatment depends on.

| | RDT | Film |
|---|---|---|
| Malaria or not | Yes | Yes |
| Which species | Mostly *P. falciparum* (HRP2) only | Yes |
| How many parasites (density) | No | Yes |
| Still positive after treatment | **Often, for weeks** (HRP2 lingers) | No, once parasites clear |

So when the ward says "the RDT is positive, just confirm it", the answer is the film, now. A sick patient's malaria film is urgent: report it within the hour.

## Thick and thin films
- **Thick film**: a small drop spread to the size of a coin. The red cells are lysed when it is stained, so it concentrates the blood: it is where parasites are **found and counted**.
- **Thin film**: spread like a blood film. Red cells stay intact: it is where the **species** is told.
- **Fix only the thin film** (methanol). A fixed thick film can't lyse, and parasites hide under the red cells.
- Stain both (Giemsa here; follow your SOP).`],
  ["Reading the films", `## *P. falciparum*, the commonest here
- **Ring forms**: a thin ring of blue cytoplasm with one or two red chromatin dots, inside red cells that are **not enlarged**.
- **Several rings in one cell** are common, especially when the density is high.
- **Gametocytes**: **crescent ("banana") shaped**. They mean the infection has been there a week or more, and they are what a mosquito picks up.

## How far to look
A positive can be found in a few fields. A **negative** is only reported after **100 thick-film fields** searched under oil. Fewer, and a light infection is missed.

## Counting
- **Thick film**: count asexual parasites against **200 white cells**. Density = parasites × 8,000 ÷ 200 (8,000 white cells/µL is the usual assumption; use the patient's own count if your SOP says so).
- **Very heavy infections** are counted on the **thin film** instead: parasitised red cells per 1,000. 6.5% of 5,000,000 red cells/µL is about 325,000 parasites/µL.`],
  ["Reporting it", `## A positive
Report the **species** and the **density**: for example, "*P. falciparum* seen. 1,920 asexual parasites/µL (thick film, against 200 white cells). Gametocytes seen." A plus count ("++") can't be compared from one film to the next, so nobody can tell whether treatment is working.

## A severe density
Above the lab's severe level (250,000/µL here) the patient has **severe malaria** and needs IV artesunate now. **Phone it** to the nurse or doctor, identify the patient by name, date of birth and lab number, and ask for a **read-back**. "325,000" heard as "32,500" is ten times too low: correct it.

## A negative, with a positive RDT
"No malaria parasites seen in 100 thick-film fields." If ELIMS shows recent treatment, say that the RDT can stay positive for weeks after it. Reporting malaria you didn't see means more antimalarials, and the real cause of the fever goes unlooked for.`],
];

const QUESTIONS = [
  ["The RDT is positive and the ward wants to skip the film. What do you do?", ["Report it positive from the RDT", "Do the film now: it gives the species and the density", "Do the film tomorrow"], 1],
  ["Which film do you fix in methanol?", ["The thin film only", "The thick film only", "Both"], 0],
  ["48 parasites are counted against 200 white cells, taking 8,000 white cells/µL. The density is:", ["48/µL", "1,920/µL", "384,000/µL"], 1],
  ["How many thick-film fields before you report a film negative?", ["10", "50", "100"], 2],
  ["The RDT is positive, 100 fields show no parasites, and ELIMS shows treatment 16 days ago. What is most likely?", ["Missed parasites: report positive", "HRP2 antigen persisting after treatment: report negative, with a note", "A faulty stain"], 1],
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
     VALUES ($1,$2,$3,'Haematology','published',80,24,0,TRUE,TRUE,'on_pass','mal-201',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "The RDT was positive and the ward wants a yes. Make thick and thin films, read them under oil, tell the species and count the density, then report it properly: phone a severe one, and report a true negative only after the full search. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical mal-201`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
