// Seed BB-201 — the blood bank — a course that ends in the 3D blood bank practical.
//
//   node -r dotenv/config scripts/seed-bb201.js            # create it if missing
//   node -r dotenv/config scripts/seed-bb201.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "BB-201 Blood bank: the right unit";

const LESSONS = [
  ["Before anything is grouped", `Most transfusion deaths are not laboratory mistakes in the test: they are **the wrong patient's blood**, in the tube or at the bedside.

## The sample
- Labelled **at the bedside**, by hand, by the person who took it, from the patient's wristband, never from a pre-printed label made earlier.
- Name, date of birth, hospital number, date, signature: every detail must **match the request form**. Anything missing or different: reject it, and ask for a new one. Never relabel.

## The group on record
Always check the patient's **previous group** in ELIMS. If today's group differs, one of the two samples came from someone else (**wrong blood in tube**). Don't crossmatch it: ask for a new sample, labelled at the bedside.

## When she can't wait
**Emergency (uncrossmatched) O RhD negative** units are kept for patients who can't wait for a crossmatch. The doctor signs for them. Never send group-specific blood on a group someone remembers.`],
  ["Reading forward and reverse grouping", `**Forward grouping** tests the patient's red cells against anti-A, anti-B and anti-D. **Reverse grouping** tests the patient's plasma against A cells and B cells. Clumps mean a reaction.

| Group | Anti-A | Anti-B | Anti-D | A cells | B cells |
|---|---|---|---|---|---|
| A RhD positive | + | − | + | − | + |
| B RhD positive | − | + | + | + | − |
| O RhD positive | − | − | + | + | + |
| AB RhD positive | + | + | + | − | − |
| O RhD negative | − | − | − | + | + |
| A RhD negative | + | − | − | − | + |

The forward and reverse results must **agree**: group A cells mean anti-B in the plasma, so the B cells clump. If they don't agree, don't report a group: find out why.

## The crossmatch
Take units of the patient's group, check they are in date and intact, and test the patient's plasma against the donor cells (a gel card, spun). No reaction: compatible. Print and attach the compatibility label.`],
  ["Issuing the unit", `The last check is at the hatch, and it is the one that stops blood going to the wrong bed.

## Three things, all the same patient
1. The porter's **collection slip**.
2. The **compatibility label** on the unit.
3. The **request**.

Name, **date of birth** and **hospital number** on all three. Two patients with the same name are common: the name alone proves nothing.

## The register
Whoever hands the unit over and whoever collects it **both sign** the issue register, with the time.

## Time
The transfusion should start **within 30 minutes** of the unit leaving the fridge (follow your SOP). Tell the porter.`],
];

const QUESTIONS = [
  ["Today's sample groups as A RhD positive. ELIMS has the patient as B RhD positive from last year. What do you do?", ["Crossmatch A units: today's result is the latest", "Don't crossmatch: ask for a new bedside-labelled sample, offer emergency O negative if needed", "Crossmatch B units: the record is older and more reliable"], 1],
  ["Anti-A no reaction, anti-B no reaction, anti-D reaction; A cells clump, B cells clump. The group is:", ["AB RhD positive", "O RhD positive", "O RhD negative"], 1],
  ["The porter's slip has the right name but a different date of birth and hospital number. What do you do?", ["Issue it: the name matches", "Don't issue: it is for a different patient; call the ward", "Issue it and ask the ward to check"], 1],
  ["A bleeding patient can't wait for a crossmatch. What can be given?", ["Emergency O RhD negative units, signed for by the doctor", "Group-specific blood on the group the midwife remembers", "Nothing until the crossmatch is done"], 0],
  ["The ward asks you to relabel a sample with the right details. What do you do?", ["Relabel it carefully", "Refuse: ask for a new sample, labelled at the bedside", "Relabel it and note it in ELIMS"], 1],
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
     VALUES ($1,$2,$3,'Blood transfusion','published',80,24,0,TRUE,TRUE,'on_pass','bb-201',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "A woman is bleeding after delivery. Check the sample, read the grouping tile, check her group on record, crossmatch, and issue only when the slip, the label and the request agree. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical bb-201`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
