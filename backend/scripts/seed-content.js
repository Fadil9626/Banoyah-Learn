// ─────────────────────────────────────────────────────────────────────────────
// Real lesson content + assessments for the four starter courses.
//
// Idempotent. Lessons are UPDATED IN PLACE by position (preserving lesson ids) so
// existing learner progress (enrollments.completed_lessons references lesson ids)
// stays valid; quiz questions have no such references, so they're replaced wholesale.
// Matches courses by title within each org. Run:
//   node -r dotenv/config scripts/seed-content.js
// Images: SVG diagrams are served same-origin from /lessons/*.svg (frontend/public);
// photos come from Wikimedia's stable Special:FilePath redirect.
// ─────────────────────────────────────────────────────────────────────────────
const pool = require("../config/db");

const IMG = {
  chain: "/lessons/chain-of-infection.svg",
  moments: "/lessons/five-moments.svg",
  triangle: "/lessons/fire-triangle.svg",
  racepass: "/lessons/race-pass.svg",
  cia: "/lessons/cia-triad.svg",
  gloves: "https://commons.wikimedia.org/wiki/Special:FilePath/Surgical_gloves.jpg?width=900",
  sanitizer: "https://commons.wikimedia.org/wiki/Special:FilePath/Hand_sanitizer_dispenser.jpg?width=900",
  handwash: "https://commons.wikimedia.org/wiki/Special:FilePath/Hand_washing_with_soap.jpg?width=900",
  extinguisher: "https://commons.wikimedia.org/wiki/Special:FilePath/Fire_extinguisher.jpg?width=900",
  padlock: "https://commons.wikimedia.org/wiki/Special:FilePath/Padlock.jpg?width=900",
};

const COURSES = [
  {
    title: "Infection Prevention & Control",
    description: "How infections spread in care settings and the standard precautions every worker uses to break the chain — hand hygiene, PPE, and the safe handling of sharps and the environment.",
    lessons: [
      {
        title: "The Chain of Infection",
        body: `# How infection spreads

Every healthcare-associated infection follows the same six-link **chain**. An infection can only pass from one person to the next if all six links connect — so **breaking any single link stops the spread**.

![The six links in the chain of infection](${IMG.chain})

- **Infectious agent** — the bacteria, virus or fungus itself.
- **Reservoir** — where it lives: people, equipment, water, surfaces.
- **Portal of exit** — how it leaves: coughs, blood, faeces, wounds.
- **Mode of transmission** — how it travels: hands, droplets, contaminated items.
- **Portal of entry** — how it gets in: broken skin, mucous membranes, catheters.
- **Susceptible host** — the next person, especially if unwell or immunocompromised.

## Standard precautions

**Standard precautions** are the baseline actions you take with **every** patient, every time — because you cannot tell by looking who is carrying an infection. They include hand hygiene, PPE matched to the task, safe handling of sharps, safe management of spills, and cleaning of the environment.

> Treat every person's blood and body fluids as potentially infectious. This protects them, the next patient, and you.`,
      },
      {
        title: "Personal Protective Equipment (PPE)",
        body: `# PPE: your barrier against transmission

PPE puts a physical barrier between you and infectious material. Choose it based on the **task and the expected exposure** — not on the patient's diagnosis.

![Gloves are the most-used item of PPE](${IMG.gloves})

## Match PPE to the task

- **Gloves** — when you may touch blood, body fluids, broken skin or contaminated items.
- **Apron or gown** — when your clothing may be splashed or soiled.
- **Mask and eye protection** — when fluids may splash to your face, or for respiratory precautions.

## Order matters

Put PPE on before contact, and take it off carefully so you don't contaminate yourself.

- **Donning (on):** apron → mask → eye protection → gloves.
- **Doffing (off):** gloves → apron → eye protection → mask.

The rule for doffing is to **remove the most contaminated item first**, then perform hand hygiene as soon as the gloves are off — and again once everything is removed.

> Gloves are **not** a substitute for hand hygiene. Hands still get contaminated during glove removal, and gloves can have tiny defects.`,
      },
      {
        title: "Sharps, Spills & a Clean Environment",
        body: `# Handle sharps safely

Needlestick and sharps injuries are a leading cause of blood-borne exposure among health workers — and nearly all are preventable.

- **Never re-cap** a used needle.
- Dispose of sharps **immediately**, at the point of use, into a proper **sharps bin**.
- The person who **used** the sharp disposes of it.
- Fill sharps bins only to the line — **never overfill**, and seal them when closed.

## Clean up spills promptly

Deal with blood and body-fluid spills straight away: wear gloves (and an apron if needed), contain and absorb the spill, clean the area, then disinfect. Dispose of the waste as clinical waste.

## A clean environment breaks the chain

Frequently-touched surfaces — bed rails, door handles, call bells, keyboards — are reservoirs. Routine cleaning and disinfection, especially **between patients**, removes that reservoir before it reaches the next person.

![Alcohol-based hand rub at the point of care](${IMG.sanitizer})

> If you have a sharps injury: **encourage bleeding, wash under running water, cover it, and report it immediately** so post-exposure care can start without delay.`,
      },
    ],
    questions: [
      { prompt: "How can you break the chain of infection?", options: ["Only once a patient has a confirmed diagnosis", "By breaking any single link in the chain", "Only by removing all six links at once", "Only by giving antibiotics"], correct: 1 },
      { prompt: "Standard precautions apply to…", options: ["Only patients known to have an infection", "Only patients in isolation", "Every patient, every time", "Only during surgery"], correct: 2 },
      { prompt: "Immediately after removing your gloves you should…", options: ["Put on a fresh pair", "Perform hand hygiene", "Nothing — your hands stayed clean", "Only wash if they look dirty"], correct: 1 },
      { prompt: "The correct order for taking OFF PPE begins with…", options: ["Mask", "Gloves", "Apron", "Eye protection"], correct: 1 },
      { prompt: "A used needle should be…", options: ["Re-capped, then binned", "Disposed of immediately into a sharps bin at the point of use", "Left for housekeeping to clear", "Placed in the general waste"], correct: 1 },
    ],
  },

  {
    title: "Hand Hygiene Essentials",
    description: "The single most effective way to prevent healthcare-associated infection — when to clean your hands, the WHO 5 Moments, and the correct handrub and handwash technique.",
    lessons: [
      {
        title: "Why Hand Hygiene Matters",
        body: `# The most important thing you do

Hands are the **main route** by which germs spread in care settings. Cleaning your hands at the right moments is the **single most effective** action to prevent healthcare-associated infection — simpler and more powerful than any drug.

![Alcohol-based hand rub makes hand hygiene fast and available at the bedside](${IMG.sanitizer})

## Handrub or handwash?

- **Alcohol-based handrub** is preferred for most situations — it is faster, more effective against most germs, and gentler on the skin.
- **Soap and water** is required when hands are **visibly dirty**, after using the toilet, and when caring for a patient with **diarrhoea** (e.g. suspected *C. difficile* or norovirus), where alcohol is less effective.

## Look after your hands

Healthy skin is itself a barrier. Use moisturiser, cover any cuts with a waterproof dressing, keep nails short, and avoid rings and artificial nails — germs collect underneath them.`,
      },
      {
        title: "Your 5 Moments for Hand Hygiene",
        body: `# When to clean your hands

The WHO **"My 5 Moments"** approach names the exact points where germs are most likely to transfer — organised around each contact with the patient.

![The WHO My 5 Moments for Hand Hygiene](${IMG.moments})

1. **Before touching a patient** — protect the patient from germs on your hands.
2. **Before a clean or aseptic procedure** — protect the patient from germs entering their body.
3. **After body-fluid exposure risk** — protect yourself and the environment.
4. **After touching a patient** — protect yourself and the environment.
5. **After touching the patient's surroundings** — the bed, monitor and table are contaminated even if you never touched the patient.

> Moments 1 and 2 protect the **patient**. Moments 3, 4 and 5 protect **you and everyone else**.`,
      },
      {
        title: "How To Do It: Technique",
        body: `# Technique is what makes it work

Cleaning your hands only works if you cover **every surface**. The spots people miss most are the **fingertips, thumbs and the areas between the fingers** — exactly the parts that touch the patient most.

![Wash with soap and water when hands are visibly dirty](${IMG.handwash})

## Handrub — 20–30 seconds

Apply enough gel to cover all surfaces, then rub: palm to palm; back of each hand; between the fingers; backs of the fingers; each thumb; and fingertips into each palm. Keep going until dry — **don't wipe or fan**.

## Handwash — 40–60 seconds

Wet your hands, apply soap, and use the **same movements** for 20–30 seconds. Rinse, dry thoroughly with a paper towel, and **use the towel to turn off the tap**.

> Miss the fingertips and you miss the part of your hand that touches the patient most. Technique matters more than speed.`,
      },
    ],
    questions: [
      { prompt: "The preferred method of hand hygiene in most clinical situations is…", options: ["Soap and water, always", "Alcohol-based handrub", "Wiping on a paper towel", "Putting on gloves"], correct: 1 },
      { prompt: "You must use soap and water (not gel) when…", options: ["Before touching any patient", "Hands are visibly dirty, or after caring for a patient with diarrhoea", "After touching the bed", "In every single case"], correct: 1 },
      { prompt: "Which of these is one of the WHO 5 Moments?", options: ["After finishing your shift", "Before touching a patient", "When you arrive at work", "Before your lunch break"], correct: 1 },
      { prompt: "Moments 1 and 2 mainly protect…", options: ["You, the worker", "The patient", "The housekeeping team", "Your manager"], correct: 1 },
      { prompt: "The most commonly missed part of the hands is…", options: ["The palms", "The wrists", "The fingertips and between the fingers", "The forearms"], correct: 2 },
    ],
  },

  {
    title: "Fire Safety & Evacuation",
    description: "How fires start, how to respond safely in the first moments, how to use an extinguisher, and how to evacuate and account for everyone.",
    lessons: [
      {
        title: "How Fires Start: The Fire Triangle",
        body: `# Three things a fire needs

A fire needs **three** things at the same time: **heat**, **fuel** and **oxygen** — together, the **fire triangle**. Take away any one side and the fire cannot start or continue.

![The fire triangle — heat, fuel and oxygen](${IMG.triangle})

## Prevention removes a side before a fire begins

- **Heat** — don't overload sockets; report faulty or overheating equipment; keep heat sources clear.
- **Fuel** — don't let waste, paper, linen or boxes build up; store flammable liquids correctly.
- **Oxygen** — keep **fire doors closed**; they starve a fire of air and hold back smoke.

> Good housekeeping *is* fire prevention. Most workplace fires start with electrical faults or accumulated rubbish.`,
      },
      {
        title: "If a Fire Starts: RACE & PASS",
        body: `# Act in the right order

If you discover a fire, follow **RACE**. If it is small and safe to tackle, an extinguisher is used with **PASS**.

![RACE response and PASS extinguisher technique](${IMG.racepass})

## RACE

- **R**escue anyone in immediate danger.
- **A**larm — raise the alarm and call for help.
- **C**onfine — close doors to hold back fire and smoke.
- **E**xtinguish only if small and safe, otherwise **E**vacuate.

## PASS — using an extinguisher

Stand back, then: **P**ull the pin · **A**im at the **base** of the fire · **S**queeze the handle · **S**weep side to side.

![Know where your nearest extinguisher is — before you need it](${IMG.extinguisher})

> Only tackle a fire if it is small, you have an exit behind you, and you are trained. **If in doubt, get out** — and never let a fire come between you and your exit.`,
      },
      {
        title: "Evacuate & Account for Everyone",
        body: `# Getting out safely

When the alarm sounds, **stop what you're doing and leave** by the nearest safe exit.

- **Do not use lifts.**
- Close doors behind you as you go.
- **Do not stop** to collect belongings.
- Help those who need assistance; follow your unit's plan for patients who can't move themselves.

## At the assembly point

Go straight to your **assembly point** and stay there, so everyone can be **accounted for**. Do not re-enter the building for any reason until the fire service says it is safe.

## Know this *before* there's a fire

Learn your nearest exits (and the second-nearest), where the alarm call-points and extinguishers are, and where your assembly point is. In smoke, **keep low** — the cleanest air is near the floor.`,
      },
    ],
    questions: [
      { prompt: "The three parts of the fire triangle are…", options: ["Heat, fuel, oxygen", "Smoke, heat, water", "Fuel, water, spark", "Heat, foam, oxygen"], correct: 0 },
      { prompt: "Keeping fire doors closed helps by…", options: ["Adding fuel to the fire", "Removing oxygen and holding back smoke", "Cooling the whole building", "Nothing useful"], correct: 1 },
      { prompt: "In RACE, the 'A' stands for…", options: ["Aim", "Alarm", "Attack", "Assemble"], correct: 1 },
      { prompt: "With an extinguisher (PASS), you aim at…", options: ["The top of the flames", "The base of the fire", "The smoke above it", "The ceiling"], correct: 1 },
      { prompt: "When the alarm sounds, you should…", options: ["Use the lift to get out faster", "Collect your belongings first", "Leave by the nearest exit and go to the assembly point", "Finish your current task first"], correct: 2 },
    ],
  },

  {
    title: "Patient Data Confidentiality",
    description: "Your duty to protect patient information — the principles behind it, how to handle records securely on paper and screen, and how to recognise and report a breach.",
    lessons: [
      {
        title: "The Duty of Confidentiality",
        body: `# Information held in confidence

Patients share sensitive information trusting that it will be protected. Keeping that trust is a **professional and legal duty** for everyone who handles patient data — clinical or not.

![Confidentiality, integrity and availability of patient information](${IMG.cia})

Good information handling protects three things:

- **Confidentiality** — only the right people can see it.
- **Integrity** — it stays accurate and unaltered.
- **Availability** — it is there when care needs it.

## Two guiding rules

- **Need to know** — access information only if you need it to do **your** job. Curiosity is never a reason.
- **Minimum necessary** — share only the **least** information required, with only the people who need it.

> Looking up the record of a friend, relative, colleague or public figure "just to check" is a breach — even if you never tell anyone.`,
      },
      {
        title: "Handling Records Securely",
        body: `# Everyday secure habits

Most breaches aren't hacks — they're everyday slips. Small habits prevent them.

![Protect access — lock screens and never share logins](${IMG.padlock})

## On screen

- **Never share your login** or password; your account is **you**.
- **Lock your screen** whenever you step away.
- Angle screens so they can't be read by passers-by.
- Always log in as **yourself** — never work under someone else's account.

## On paper and in conversation

- Keep paper records **closed and stored securely** — not left on desks or trolleys.
- Don't discuss patients where you can be **overheard** — corridors, lifts, canteens.
- Send information only through **approved, secure** channels, and check the address before you send.
- Dispose of confidential paper in **confidential waste**, never the ordinary bin.`,
      },
      {
        title: "Recognise & Report a Breach",
        body: `# When something goes wrong

A **breach** is any time information is lost, seen, changed or shared without authorisation — for example a misdirected email, a lost document or USB stick, a shared password, or opening a record you had no reason to see.

## Report it straight away

If you cause, spot or suspect a breach, **report it immediately** through your organisation's process. Don't wait, and don't try to hide it — fast reporting limits the harm and lets the right people act.

> Reporting your own mistake early is **not** what gets people into trouble — **failing to report it** is. Speaking up protects patients.

## The takeaways

- **Need to know**, **minimum necessary** — every time.
- Lock screens, protect logins, and mind who can overhear.
- If in doubt, **report it**.`,
      },
    ],
    questions: [
      { prompt: "The 'need to know' principle means you access information…", options: ["Whenever you're curious", "Only if you need it to do your job", "For any patient in the building", "Only your own record"], correct: 1 },
      { prompt: "Looking up a relative's record 'just to check' is…", options: ["Fine, if you don't tell anyone", "A breach of confidentiality", "Allowed for family members", "Only a problem if they complain"], correct: 1 },
      { prompt: "When you step away from a computer you should…", options: ["Leave it — you'll be back soon", "Lock the screen", "Ask a colleague to watch it", "Dim the monitor"], correct: 1 },
      { prompt: "Sharing your login with a trusted colleague is…", options: ["Fine if they're a staff member", "Never acceptable — your account is you", "Okay during busy periods", "Recommended for good teamwork"], correct: 1 },
      { prompt: "If you suspect a data breach you should…", options: ["Wait to see if anyone notices", "Report it immediately through the proper process", "Fix it quietly and say nothing", "Only report it if it was your fault"], correct: 1 },
    ],
  },
];

async function main() {
  const client = await pool.connect();
  let courses = 0, lessons = 0, questions = 0;
  try {
    for (const c of COURSES) {
      const found = await client.query("SELECT id FROM courses WHERE title = $1 ORDER BY id LIMIT 1", [c.title]);
      if (!found.rows.length) { console.log(`  ! course not found, skipped: ${c.title}`); continue; }
      const courseId = found.rows[0].id;

      await client.query("BEGIN");
      await client.query("UPDATE courses SET description = $2, updated_at = now() WHERE id = $1", [courseId, c.description]);

      // Update lessons in place by position (preserves ids → learner progress stays valid).
      const existing = (await client.query("SELECT id FROM lessons WHERE course_id = $1 ORDER BY sort, id", [courseId])).rows;
      for (let i = 0; i < c.lessons.length; i++) {
        const l = c.lessons[i];
        if (existing[i]) {
          await client.query("UPDATE lessons SET sort = $2, title = $3, type = 'text', body = $4 WHERE id = $1", [existing[i].id, i, l.title, l.body]);
        } else {
          await client.query("INSERT INTO lessons (course_id, sort, title, type, body) VALUES ($1, $2, $3, 'text', $4)", [courseId, i, l.title, l.body]);
        }
        lessons++;
      }
      // Remove any extra placeholder lessons beyond our set.
      for (let i = c.lessons.length; i < existing.length; i++) {
        await client.query("DELETE FROM lessons WHERE id = $1", [existing[i].id]);
      }

      // Questions have no external references → replace wholesale.
      await client.query("DELETE FROM quiz_questions WHERE course_id = $1", [courseId]);
      for (let i = 0; i < c.questions.length; i++) {
        const q = c.questions[i];
        await client.query(
          "INSERT INTO quiz_questions (course_id, sort, prompt, options, correct_index) VALUES ($1, $2, $3, $4, $5)",
          [courseId, i, q.prompt, JSON.stringify(q.options), q.correct]
        );
        questions++;
      }

      await client.query("COMMIT");
      courses++;
      console.log(`  ✓ ${c.title}: ${c.lessons.length} lessons, ${c.questions.length} questions`);
    }
    console.log(`\n✓ Content seed complete: ${courses} courses, ${lessons} lessons, ${questions} questions.`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("✗ Content seed failed:", e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
