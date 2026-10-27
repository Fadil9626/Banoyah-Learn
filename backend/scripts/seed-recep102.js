// Seed RECEP-102 — sample reception and rejection — a course that ends in the
// 3D reception-counter practical.
//
//   node -r dotenv/config scripts/seed-recep102.js            # create it if missing
//   node -r dotenv/config scripts/seed-recep102.js --replace  # wipe and recreate
//
// --replace deletes the course, and with it every enrolment, quiz attempt and
// practical result on it. Without the flag an existing course is left alone.
const pool = require("../config/db");

const TITLE = "RECEP-102 Sample reception and rejection";

const LESSONS = [
  ["Before you sign: the handover", `Signing for a sample makes the lab responsible for it. Check first, then sign.

## Check every sample while the nurse is still at the counter
- Take the **urgent** samples first.
- Compare the **label on the tube** with the **request form**: full name, date of birth and lab number must all match.
- Check the **test** on the form against the **tube** it came in.
- Look at the tube itself (next lesson).

## Labels are not negotiable
- A tube with **no label** cannot be matched to anybody. Reject it.
- A tube whose label **disagrees with its form** may hold another patient's blood. Reject it.
- **Never relabel** a sample, and never let anybody else relabel it for you. Nobody can prove whose blood is in that tube. It has to be recollected from the patient.`],
  ["What makes a sample unfit", `These are the reasons ELIMS records at sample reception. Learn what each one looks like, and why it matters.

| Reason in ELIMS | What you see | Why it matters |
|---|---|---|
| Hemolyzed Sample | Serum pink to red instead of straw | Red cells have burst: potassium reads falsely high, sometimes as a false critical |
| Clotted Sample | A clot or strands in an EDTA or citrate tube | Cells are trapped: counts read low; a clotted citrate tube gives no valid PT |
| Insufficient Volume (QNS) | Citrate tube below its fill line | The 9:1 blood to citrate ratio is lost: PT reads falsely long |
| Mislabeled / Unlabeled Tube | No label, or label and form disagree | Could be the wrong patient's blood: always recollect |
| Wrong Tube Type Drawn | e.g. U&E in a purple EDTA tube | EDTA adds potassium and binds calcium; no fluoride lets glucose fall |
| Leaked / Damaged in Transit | Blood on the outside, loose cap, cracked tube | A biohazard, and possibly contaminated or short |
| Temperature Excursion | Arrived too warm or too cold for the test | Some results change with temperature |

Tilt each tube gently while you look: clots and fibrin show best that way.`],
  ["Rejecting a sample and telling the ward", `## Record it
Reject the sample in ELIMS with the **right reason**. The ward fixes what you tell them, so a vague or wrong reason means the next sample has the same problem.

## Phone the ward
Urgent samples especially: the patient is waiting for a result. Be specific and courteous:

> "This is the lab. Two of your samples can't be processed: Fatmata Conteh's U&E is haemolysed, and the PT for Sorie Koroma is under-filled. Please recollect them. I've recorded the reasons in ELIMS."

## Never
- Never accept a mislabelled or unlabelled sample "just this once".
- Never ask the ward to come down and correct a label. It must be recollected.
- Never top up an under-filled tube or pour a sample into a different tube.`],
];

const QUESTIONS = [
  ["A U&E sample arrives with pink-red serum. What do you do?", ["Accept it and add a comment", "Reject it as Hemolyzed Sample", "Spin it again and accept it"], 1],
  ["The date of birth on a tube's label differs from its request form. What do you do?", ["Reject it as mislabelled and ask for a recollection", "Ask the ward to come and correct the label", "Accept it, because the name matches"], 0],
  ["A light blue citrate tube for PT/INR is filled to half. What do you do?", ["Accept it: the PT does not depend on volume", "Top it up from another tube", "Reject it as Insufficient Volume (QNS): the 9:1 ratio is lost"], 2],
  ["A U&E request arrives in a purple EDTA tube. What do you do?", ["Reject it as Wrong Tube Type Drawn: EDTA adds potassium", "Accept it", "Pour it into a gold tube"], 0],
  ["When do you sign for samples from a ward?", ["As soon as the nurse hands them over", "After checking each one against its form", "At the end of the shift"], 1],
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
     VALUES ($1,$2,$3,'Phlebotomy & Reception','published',80,24,0,TRUE,TRUE,'on_pass','recep-102',70,70,80,$4) RETURNING id`,
    [admin.org_id, TITLE,
     "Check samples at the reception counter: labels against forms, haemolysis, clots, fill volume, wrong tubes and leaks. Reject with the reason ELIMS records, and tell the ward. Study the three lessons, pass the quiz, then take the 3D practical.",
     admin.id]
  )).rows[0];
  for (const [i, [title, body]] of LESSONS.entries())
    await pool.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1,$2,$3,'text',$4)", [course.id, i, title, body]);
  for (const [i, [prompt, options, correct]] of QUESTIONS.entries())
    await pool.query("INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1,$2,$3,$4,$5)",
      [course.id, i, prompt, JSON.stringify(options), correct]);
  console.log(`✓ ${TITLE} — course ${course.id}, ${LESSONS.length} lessons, ${QUESTIONS.length} questions, practical recep-102`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
