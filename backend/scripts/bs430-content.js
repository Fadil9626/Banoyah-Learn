// BS-430 Operator Training — course content for the seven-level track.
//
// Summarized from the Mindray BS-430 Operator's Manual (397 pages). Each entry
// becomes one course; `prerequisite` chaining is applied by seed-bs430.js in
// array order, so Level N unlocks only once Level N-1 is passed. Lesson bodies
// are Markdown — rendered by frontend/src/components/LessonContent.jsx.
//
// Page references in lesson bodies point back to the full manual, which the
// seeder attaches to every level as a PDF reference lesson.

const CATEGORY = "Laboratory Equipment";

const LEVELS = [
  // ── Level 1 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 1 — Safety & System Orientation",
    category: CATEGORY,
    pass_mark: 80,
    description:
      "Before you touch the analyzer: the hazards it presents, the precautions that keep you and your results safe, and a guided tour of the hardware, software and specifications. Higher pass mark than later levels — this is the safety gate for the whole track.",
    lessons: [
      {
        title: "Safety Symbols & How the Manual Warns You",
        body: `The manual uses four symbols. Learning to read them is the first skill, because every later chapter assumes you react correctly when one appears.

| Symbol | What it means |
|---|---|
| **WARNING** | An operating hazard that can cause **personal injury**. |
| **BIOHAZARD** | A potentially **biohazardous** condition — infection risk. |
| **CAUTION** | Possible **system damage or unreliable results**. |
| **NOTE** | Information that requires your attention. |

> If the product is used in a manner not specified by the manufacturer, the protection provided by the product may be impaired.

That sentence is the reason this level exists. The BS-430 is safe *as specified* — improvising around a procedure removes that guarantee.

### Intended use

The BS-430 is an automated chemistry analyzer for **in vitro diagnostic use** in clinical laboratories. It performs quantitative determination of clinical chemistries in **serum, plasma, urine and cerebrospinal fluid**.

Two limits follow from that:

- Consult the manufacturer before using the instrument for any other purpose.
- When drawing a clinical conclusion, always refer to the patient's clinical symptoms and other test results — never the analyzer result alone.`,
      },
      {
        title: "Electrical, Moving-Part and Light Hazards",
        body: `### Electric shock

- When the MAIN POWER is on, **only servicing personnel authorized by the manufacturer** may open the rear or side cover.
- Never place samples or reagents on top of the instrument. Spillage can cause equipment failure and electric shock.
- If something spills: **switch off the power immediately**, remove the spillage, then contact Customer Service or your distributor.
- Do not touch or remove the power supply shield while the power is on.

### Moving parts

The sample carousel, reagent carousel, reaction carousel, sample probe, reagent probe, mixer and cuvette wash station all move under power.

- Do not touch any of them while the system is in operation.
- Do not put fingers or hands into any open part during operation.
- Around the ISE module, keep hair, clothing and limbs clear of the driving parts.

### Photometer lamp

- **Do not stare into the lamp** during operation — light emission can injure the eyes.
- To replace the lamp: switch off the MAIN POWER, then **wait at least 5 minutes** for it to cool. Touching it sooner will burn you.

### Laser (bar code readers)

Both the sample and reagent bar code readers emit a laser beam. Do not stare into it while the system is running.

### Fire

Ethanol is flammable. Exercise caution when using it around the instrument.`,
      },
      {
        title: "Biohazards, Reagents and Waste",
        body: `### Samples, calibrators and controls — BIOHAZARD

- Never touch samples, controls, calibrators, mixtures or waste **with bare hands**. Wear gloves and a lab coat, and goggles where necessary.
- If your skin contacts a sample, control or calibrator, follow your standard laboratory safety procedure and consult a doctor.
- Serum residue on the **ISE electrodes** may carry a high viral load. Always wear gloves when working around the electrodes.

### Reagents and wash solution

Reagents and **concentrated wash solution are corrosive to skin**.

- On skin or clothing: wash off with soap and clean water.
- In the eyes: rinse with plenty of water and consult an ophthalmologist.
- **ISE wash solution is sodium hypochlorite** — same precautions; rinse with fresh water and see a doctor on contact.
- ISE calibrators contain preservatives. If swallowed, see a doctor.

### Waste

Substances in reagent, control, calibrator, concentrated wash solution and waste are subject to contamination and disposal regulations.

- Dispose of waste according to your **local or national biohazard waste rules**.
- Consult the reagent manufacturer or distributor for substance-specific guidance.
- The same applies to the analyzer itself at end of life — it is subject to contamination regulations, not general waste.

### Decontamination

- Decontaminate per your laboratory's safety regulations after any spill.
- For large-volume liquid ingress, contact Customer Service.
- **Strong acid or alkaline solutions are forbidden** as cleaning agents.
- Never use a cleaning or decontamination agent that could react hazardously with the equipment. If in doubt, ask before you apply it.

### Removing the analyzer from service

Before repair, transport or disposal, clean and sterilize any part or surface that could present a biohazard — sample probe, reagent probe and so on — and warn whoever handles the device next.`,
      },
      {
        title: "Operating Precautions You Must Internalize",
        body: `These are the day-to-day rules. Most unreliable-result incidents trace back to one of them.

### Running the system

- Run **calibration and QC** when using the system for the first time.
- Run **QC every time you use the system** — otherwise results may be unreliable.
- Keep the reagent carousel cover **closed** during operation. Opening it mid-run aborts the analysis and invalidates running tests.
- After switching MAIN POWER off, **wait at least 10 seconds** before switching it on again, or the system may enter protection status.
- Do not touch the display, mouse or keyboard with wet or chemically contaminated hands.

### The operation unit is not a general-purpose PC

- The RS-232 port on the analyzing unit connects to the **operation unit only**.
- Do not install other software or hardware on the computer, and do not run other software while the system is working.
- **Do not connect it to the Internet** or use it for other purposes — a virus can destroy the operating software or test data.

### Samples

- Samples must be **free of insoluble matter** such as fibrin or suspended particles, or the sample probe will clog.
- Medicines, anticoagulants and preservatives may make results unreliable.
- Hemolysis, icterus and lipemia affect results — running a **serum index test** is recommended.
- Store samples properly and do not leave them open: volatilization changes composition.
- Load samples into the **correct carousel positions** before analysis begins.

### Reagents, calibrators and controls

- Use reagents appropriate to the system's performance characteristics; consult the supplier if unsure.
- Store and use them strictly per the supplier's instructions. Improper storage gives unreliable results **even within the validity period**.
- **Always calibrate after changing reagents.**
- Carryover between reagents causes unreliable results — consult the reagent supplier.
- Check calibrator expiry dates before use, and place them correctly to avoid leaks and module damage.

### Environment and data

- Install and operate only in the environment specified in the manual.
- Keep sources of electromagnetic noise away — no radio transmitters, no extra display monitors, no other noise-generating medical instruments nearby.
- The system stores data to the built-in hard disk, but **loss is still possible**. Archive regularly to external media, and use a UPS to protect against power failure.

### ISE

If the system has an ISE module and will be powered off for a long time, perform **electrode storage maintenance** — otherwise the electrodes are damaged by water scarcity.`,
      },
      {
        title: "Labels and Silkscreen on the Instrument",
        body: `Check the labels regularly for cleanliness and integrity. If any becomes illegible or peels off, contact Customer Service for a replacement — a missing warning label is a safety defect.

### Warning labels and where they are

| Label | Location |
|---|---|
| **Biohazard** | Sample probe, waste outlet, waste tank |
| **Moving parts** | Sample and reagent probes, mixer, wash station |
| **Laser** | Near the bar code reader |
| **Photometer lamp (hot)** | On the lamp housing |
| **Probe collision** | Near the sample, reagent and reaction carousels |
| **Electrical shock** | On the power supply shield |
| **Chemical hazard** | On the diluted wash solution tank |
| **Upper cover** | On the transparent upper cover — do not wipe with ethanol or organic solvents |
| **ISE module** | Left side panel — turn off MAIN POWER before opening the small door |
| **Liquid level floater** | Near the DI water and wash solution tanks — do not remove during a test |

### Non-warning symbols

Found mainly on the product label on the rear cover: serial number, date of manufacture, **in vitro diagnostic equipment**, EC representative, and the **WEEE** label (EU only — do not dispose of as household waste).

### Switch symbols

- **Main power ON** — switch toggled rightwards, ON character exposed, green light lit.
- **Main power OFF** — switch toggled leftwards. All components stop, **including the reagent refrigeration system**.
- **Analyzer power switch** — on at the dotted-circle position, off at the blank-circle position.

That refrigeration detail matters: MAIN POWER off means your on-board reagents are no longer being cooled.`,
      },
      {
        title: "Installation Requirements",
        body: `Installation is performed by manufacturer-authorized technicians only — but the operator must understand the requirements, because environmental drift is a common cause of unreliable results.

### Site

- Indoor use only, well ventilated, free of dust, out of direct sun.
- Away from heat sources, draughts, corrosive and flammable gases.
- Level platform (gradient under **1/200**) able to bear at least **220 kg**, free of vibration.
- Away from loud noise, power supply interference, brush-type motors and frequently-switched electrical contacts.
- No mobile phones or radio transmitters nearby.
- Altitude **−400 m to 2000 m**.
- Clearance: minimum **500 mm** on the accessible sides.

### Temperature and humidity

| | Operating | Storage |
|---|---|---|
| Temperature | 15–30 °C | 0–40 °C |
| Relative humidity | 35–85 %, no condensation | 30–85 %, no condensation |

Use air conditioning if the room cannot hold these ranges.

### Power

- **100–240 V~, 50/60 Hz**, rated consumption ≤ 1000 VA.
- Voltage fluctuation ±10 %, frequency fluctuation ±1 Hz.
- Use the supplied **three-wire power cord** and a properly grounded socket. Improper grounding risks electric shock and equipment damage.
- Fuse: 250 V 10 A (both 110 V and 220 V configurations).

### Water and drainage

- Water must meet **CLSI Type II**: resistance above 1 MΩ·cm, silicate below 0.1 mg/L. Insufficiently purified water produces misleading results.
- Flow: **≥ 42 L/H average**, 2 L/min transient peak. Average consumption is ≤ 20 L/H.
- With water-purifying equipment: supply pressure 95–392 kPa, inlet tubing no longer than 10 m.
- Outlet at least 50 mm wide and no more than 100 mm high; waste tubing no longer than 5 m.
- Avoid folding or pressing tubes when connecting.

### Operation unit (computer)

CPU 2.6 GHz+, RAM 2 GB+, hard disk 160 GB+ (C: over 30 GB for the OS, D: over 100 GB for the operating software, NTFS). Screen at **1280×1024**, 32-bit colour. Turn off the screen saver, hibernation, automatic updates and Internet time synchronization. Install no other application software; if antivirus is present, disable scheduled scanning and trust the operating software and BSLOG.`,
      },
      {
        title: "Hardware Tour — Sample and Reagent Handling",
        body: `The BS-430 comprises an **analyzing unit**, an **operation unit** (computer), an **output unit** (printer), plus accessories and consumables.

The analyzer itself contains the sample handling system, reagent handling system, mixer assembly, reaction system, cuvette wash station, photometric system, and an optional ISE unit.

### Sample carousel

A turnable disk on the right of the analyzer panel with **three rings — outer, middle and inner — 34 positions each, 102 in total**.

Dedicated positions:

- **STAT:** 11 positions, E1–E11 (69–79)
- **Calibrator:** 10 positions, S1–S10 (80–89)
- **Control:** 10 positions, C1–C10 (90–99)
- **W** (102) physiological saline · **D2** (101) probe wash solution · **D1** (100) ISE wash solution

One current carousel plus **nine virtual carousels** are supported. To remove it: loosen the two retaining screws, grab the handle, pull upward. To install: align the positioning pins, seat it, tighten the screws.

> **Note:** the refrigeration unit is powered independently of the analyzing unit — it runs whenever MAIN POWER is ON.

### Sample containers

Microtubes (Φ14×25 mm 0.5 mL / 2 mL, Φ12×37 mm 2 mL) and primary or plastic tubes from Φ12×68.5 mm up to Φ13×100 mm.

- Sample must sit **8 mm above the unreachable sample level** or aspiration cannot be guaranteed.
- Whole blood (centrifuged) requires anticoagulation tubes; **EDTA tubes are recommended**. Sample height ≤ 55 mm, blood cell level ≥ 10 mm.
- **Microcups are not allowed.**
- Before loading or removing a tube, confirm the carousel and probe have **stopped**.

### Sample probe

One probe. Volumes:

- **Biochemistry:** 1.5–45 µL in 0.1 µL increments
- **ISE:** 70 µL serum/plasma, 140 µL diluted urine
- **Dilution factor:** 3–134

Built-in protections: clog detection (optional), horizontal and vertical obstruct detection with auto-guard, level detection and tracking, and an empty-aspiration alarm. The probe is washed inside and out in its wash well.

### Reagent carousel

**92 bottle positions**, refrigerated to a constant **2–8 °C, 24 hours a day**, keeping reagents stable with little volatilization. Position **D** is wash solution, **W** is deionized water or physiological saline. One virtual reagent carousel is allowed; the system prompts you to change carousels when aspiration finishes.

> **Caution:** remove the plug on the reagent carousel every day *before* analysis to prevent mechanical reset failure and a bent reagent probe. Restore the plugs after the day's tests.

### Reagent probe

One probe, **10–200 µL in 0.5 µL increments**. Concentrated reagent is supported at dilution ratios from 19:1 to 1:19 (reagent:DI water). Same protections as the sample probe, minus clog detection. Reagent bottles are 20 mL and 40 mL.`,
      },
      {
        title: "Hardware Tour — Reaction, Washing and Photometry",
        body: `### Mixer assembly

Located at the lower-left of the reaction carousel: **two mixers, one sample mixer and one reagent mixer**. They stir the reaction liquid once sample and reagent are added, then move automatically to the wash well for cleaning.

### Reaction system

The reaction carousel rotates **counter-clockwise**, carrying each cuvette in turn to the reagent dispensing, sample dispensing, mixing and washing positions.

- **93 semi-permanent plastic cuvettes**
- Reaction volume **100–300 µL**
- Temperature held at **37 ± 0.3 °C**, fluctuation ±0.1 °C
- Cuvette: 5 mm × 5 mm × 29 mm, light path **5 mm ± 0.03 mm**

After each test the system washes and dries the cuvette automatically for reuse.

### Cuvette wash station — the eight phases

| Phases | Action |
|---|---|
| 1–2 | Wash with **diluted wash solution** |
| 3–6 | Rinse with **deionized water** |
| 7–8 | **Dry and wipe** |

Phases 1–6 use **preheated** fluid. Waste is discharged in two streams — **high-concentration and low-concentration** — and the system alarms when it detects excessive waste.

### Photometric system

Inside the analyzing unit, measuring the absorbance of the reaction mixture.

- Light source: **12 V / 20 W tungsten-halogen lamp**
- Transmission: holographic concave flat-field gratings
- **12 wavelengths:** 340, 380, 412, 450, 505, 546, 570, 605, 660, 700, 740, 800 nm
- Measuring period: **8.55 seconds**

### ISE unit (optional)

Measures **Na⁺, K⁺ and Cl⁻** in serum, plasma and diluted urine by direct ion-selective electrode method. Three modules:

- **ISE module** — spacer, Na, K, Cl and reference electrodes
- **Reagent module** — calibrator A, calibrator B, waste container, reagent-volume chip
- **Pump module** — calibrator A pump, calibrator B pump, waste pump

Sample volume: 70 µL serum/plasma, 140 µL diluted urine (diluted 1:10).

> **Warning:** the ISE unit must be operated by skilled or trained clinical professionals.

### Other optional modules

Built-in **sample bar code reader** (scans the outer and middle rings of the sample carousel), built-in **reagent bar code reader** (scans all positions when you select *End Load F2* after closing the cover), the **water supply module**, and the **probe clog detection module**.`,
      },
      {
        title: "The Operating Software Screen",
        body: `Every later level works inside this screen, so learn its five areas now.

### Screen areas

1. **Status display area** — system status, test time left, pause countdown, LIS and printer status, logged-in user, date and time.
2. **Shortcut icons area**
3. **Function window** — the page or window for whatever you selected.
4. **Prompt message area** — two lines: operation prompts above, error messages below.
5. **Function buttons area**

### System statuses

- **Biochemistry:** Initialize, Incubation, Standby, Running, Pause, Stopped, Maintenance, Shutdown
- **ISE:** Initialize, Standby, Running, Stopped, Maintenance, Shutdown

The manual uses two shorthand terms throughout:

- **Non-test status** = Incubation, Standby, Stopped
- **Test status** = everything else

Many operations are only permitted in non-test status — watch for that phrase.

### Shortcut icons

| Icon | Action |
|---|---|
| **Start** | Opens *Start Conditions* — begin new analysis or resume testing |
| **Pause** | Stops sample and reagent dispensing so you can load new samples or reagents |
| **Emergency stop** | Stops all tests and actions; run **Home** to return to Standby |
| **STAT** | Opens *STAT Sample Program* for emergency samples |
| **Online help** | Context help for the current window |

### Function buttons

- **Sample** — program patient and control samples, view carousel status
- **Result** — recall patient and control results, result and test statistics
- **Reagent/Calibration** — set reagents, define calibrators, request calibrations, recall calibration results, view reagent carousel status
- **Quality Control** — define controls and QC rules, recall QC results and summary
- **Utility** — instrument commands, chemistry and system setup, maintenance, component status
- **Status/Alarm** — recall and handle error logs and edit logs
- **Exit** — log off or shut down

### Online help

Reach it four ways: the help icon at the top right, the icon beside a maintenance command or error log entry, the icon on a warning or error message window, or **Alt + F1**. Tabs: Contents, Index, Search, Favourites.

### Multi-select

- **Ctrl + click** for discontinuous items
- **Shift + click** for a continuous range`,
      },
      {
        title: "System Specifications",
        body: `Know these numbers — they define what the instrument can and cannot be asked to do.

### Throughput

| Test type | Throughput |
|---|---|
| Biochemistries (single-reagent) | up to **420 tests/hour** |
| ISE — serum/plasma | 312 samples/hour |
| ISE — urine | 177 tests/hour |
| Biochemistry + ISE combined | up to **626 tests/hour** |
| HbA1c | up to 80 tests/hour |

**Maximum simultaneous tests: 96** — 90 biochemistries, 3 ISE chemistries and 3 serum index chemistries.

### Analysis

- **Principles:** colorimetry, turbidity, ISE method
- **Reaction types:** endpoint, fixed-time, kinetic
- **Reagent modes:** single, double, triple and quadruple reagent
- **Wavelength modes:** single and double wavelength

### Physical

- Dimensions ≤ 1050 (L) × 720 (D) × 1150 (H) mm; weight ≤ 200 kg
- Noise ≤ 65 dBA

### Bar codes

| | Sample | Reagent |
|---|---|---|
| Symbologies | Codabar, ITF, Code128, Code39, UPC/EAN, Code93 | same |
| Density | 0.19–0.5 mm | 0.25–0.5 mm |
| Length | 3–27 digits | 13–30 digits |
| Max width | 55 mm | 44 mm |
| Min height | 10 mm | 12 mm |
| Max inclination | ±5° | under 5° |
| Print quality | ANSI MH10.8M Class C or better | same |

Print on coated or matte paper — common paper degrades the label. Use digits 0–9 and upper-case A–Z, and print a check digit so misreads are caught.

### Interfaces

- **RS-232** — analyzing unit ↔ operation unit; LIS; printer
- **Network** — analyzing unit ↔ operation unit; LIS
- **Parallel / USB** — printer, external storage
- **LIS protocols:** HL7 and ASTM1394, over serial or a static-IP TCP/IP network port

### Safety classification

Overvoltage Class II · Pollution degree 2 · Fixed device · Continuous operation · **IPX0** (no protection against liquids). Complies with IEC 61326-1 and IEC 61326-2-6 for EMC.`,
      },
    ],
    questions: [
      {
        prompt: "Which manual symbol alerts you to a condition that could damage the system or produce unreliable results — but not injure you?",
        options: ["CAUTION", "WARNING", "BIOHAZARD", "NOTE"],
        correct_index: 0,
      },
      {
        prompt: "You need to replace the photometer lamp. What must you do first?",
        options: [
          "Switch off the MAIN POWER and wait at least 5 minutes for the lamp to cool",
          "Pause the run and replace the lamp immediately to minimise downtime",
          "Switch off only the analyzer power switch and replace it right away",
          "Run the Home command, then replace the lamp while the system is in Standby",
        ],
        correct_index: 0,
      },
      {
        prompt: "What temperature does the reagent carousel refrigeration unit maintain, and when does it run?",
        options: [
          "2–8 °C, 24 hours a day, powered independently of the analyzing unit",
          "2–8 °C, but only while the analyzing unit is running a test",
          "15–30 °C, matching the ambient operating requirement",
          "37 ± 0.3 °C, the same as the reaction carousel",
        ],
        correct_index: 0,
      },
      {
        prompt: "Reagent has spilled onto the top of the instrument. What is the correct first action?",
        options: [
          "Switch off the power immediately, then remove the spillage",
          "Wipe it up with ethanol and continue the run",
          "Finish the current run, then decontaminate with a strong alkaline solution",
          "Open the rear cover to check whether any reagent reached the electronics",
        ],
        correct_index: 0,
      },
      {
        prompt: "How many cuvettes does the reaction carousel hold, and at what temperature does it operate?",
        options: [
          "93 cuvettes at 37 ± 0.3 °C",
          "92 cuvettes at 37 ± 0.3 °C",
          "102 cuvettes at 2–8 °C",
          "93 cuvettes at 30 ± 0.5 °C",
        ],
        correct_index: 0,
      },
      {
        prompt: "In the eight-phase cuvette wash cycle, what happens during phases 3 to 6?",
        options: [
          "The cuvette is rinsed with deionized water",
          "The cuvette is washed with diluted wash solution",
          "The cuvette is dried and wiped",
          "The cuvette is preheated before the next reaction",
        ],
        correct_index: 0,
      },
      {
        prompt: "Why must the operation unit never be connected to the Internet?",
        options: [
          "A computer virus may destroy the operating software or test data",
          "The LIS connection uses the same port and would be dropped",
          "Internet time synchronization would corrupt the reaction timing",
          "The RS-232 port cannot carry network traffic and analysis data at once",
        ],
        correct_index: 0,
      },
      {
        prompt: "What water quality does the BS-430 require?",
        options: [
          "CLSI Type II — resistance above 1 MΩ·cm and silicate below 0.1 mg/L",
          "CLSI Type I — resistance above 18 MΩ·cm and no detectable silicate",
          "Ordinary distilled water at any resistance, provided flow exceeds 42 L/H",
          "Deionized water below 0.1 MΩ·cm resistance",
        ],
        correct_index: 0,
      },
      {
        prompt: "A sample tube is loaded but the carousel is still turning. What should you do?",
        options: [
          "Wait until the sample carousel and probe have stopped before loading or removing tubes",
          "Load quickly between rotations, keeping your hand clear of the probe",
          "Press Pause, then reach in while the carousel completes its rotation",
          "Loading during rotation is fine as long as the auto-guard system is enabled",
        ],
        correct_index: 0,
      },
      {
        prompt: "How many wavelengths does the photometric system measure at?",
        options: ["12", "8", "6", "16"],
        correct_index: 0,
      },
    ],
  },

  // ── Level 2 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 2 — Daily Operation",
    category: CATEGORY,
    pass_mark: 75,
    description:
      "The full working day, start to finish: pre-startup checks, powering up, reading system status, loading every class of reagent, running routine and STAT samples, controlling a run in progress, and shutting down safely.",
    lessons: [
      {
        title: "The Daily Operating Cycle",
        body: `Every day on the BS-430 follows the same four-stage cycle. Learn the shape first; the rest of this level fills in each stage.

1. **Startup and daily checks** — checks before startup → startup → check system status
2. **Operations before routine test** — prepare reagents → calibration → QC
3. **Routine test** — run tests → check results → check test status and control the run
4. **Daily maintenance and powering off** — daily maintenance → power off → post-shutdown operations

The order is not arbitrary. Each stage is a gate: you do not load samples before the reagents are confirmed, and you do not release patient results before QC is in control.

> This chapter assumes a fully configured instrument. If your system lacks an optional module — ISE, bar code reader, water supply module — skip the relevant steps.`,
      },
      {
        title: "Checks Before Startup",
        body: `Six checks, every morning, before you touch the power switch.

### Water supply

- Confirm the deionized water tank or reservoir can supply water **continuously**.
- If you use a water unit, confirm it is powered on.
- Confirm the connections between the water supply and the analyzer are correct and tight, and that tubes are **free of twists and leaks**.

### Power supply

- Confirm power is available at the correct voltage.
- Check the connections between the analyzing unit, operation unit and printer — correct and secure.
- Check that power cords are properly seated in their sockets.

### Printing paper

Confirm sufficient paper is loaded. Refill if not.

### Waste connections

- Empty the **high-concentration waste tank** if it is not already empty. Output runs at about **1 L/H**.
- Empty the **low-concentration waste tank**.
- Confirm the low-concentration waste tube is not bent, and that **the sewer opening is lower than the system's waste outlet** — waste drains by gravity.

### Probes and mixers

Check the sample probe, reagent probe, sample mixer and reagent mixer:

- **Dirty?** Clean it.
- **Bent?** Replace it.

### Wash solutions

Check the probe wash solution on the sample and reagent carousels, and the diluted wash solution. Fill or replace as necessary.`,
      },
      {
        title: "Startup — Manual and Automatic",
        body: `### Manual startup

Switch on the power in this order:

1. **Main power switch** on the left panel
2. **Analyzing unit power switch** on the left panel
3. **Printer**
4. **Monitor and computer** of the operation unit

The operating software runs automatically when the computer starts and asks for a username and password. Select **Quick login** to skip the initialization procedure.

> **Note:** if virtual reagent carousels are in use, make sure the **No. 1 reagent carousel** is the one loaded before starting the operating software each time.

### The 20-minute rule

> **Caution:** to ensure accurate results, do not start measurement until the system status reaches **Standby** *and* the system has been on for about **20 minutes** — the light source and reaction temperature need that long to stabilize.

This is the single most commonly skipped step in daily operation, and it silently degrades early results.

### Passwords

The default administrator username and password is **Admin** — and the password is **case sensitive**.

- Change it at first login to prevent abuse of administrator privileges.
- If an *operator* forgets their password, the administrator can delete and redefine the username.
- If the *administrator* forgets theirs, you must contact Customer Service or your distributor. There is no self-service recovery.

### Auto startup

Set a weekday and time and the system powers itself up.

1. **Utility > System Setup**, click **Instrument F1**
2. Select **Sleep/Awake**, then **Auto Startup Setup**
3. Specify the weekday and time — any time from Monday to Sunday
4. **Save**, then **Close**

> **Note:** after setting the timer, leave the operation unit and analyzer connected to the power supply, or auto startup cannot occur.`,
      },
      {
        title: "Checking System Status After Startup",
        body: `Once startup finishes, work through five status checks before doing anything else.

### 1. System status

| Status | Meaning | Action |
|---|---|---|
| **Initialize** | Running the startup procedure | Wait |
| **Incubation** | Lamp on and stabilizing | Wait |
| **Standby** | Started and ready | You can start tests |
| **Stopped** | Failure during startup | **Utility > Command > Home** to initialize |

The ISE module has the same statuses minus Incubation and Pause.

**LIS status:** blue icon = connected; grey = offline. To reconnect: *Utility > System Setup*, click **Host F5**, set up LIS communication, then **Connect**.

### 2. Alarm status

Check the **Alarm** button on the left of the main screen.

- **Normal colour** — no alarm; move on.
- **Yellow** — a warning has occurred.
- **Red** — an error, or both warning and error.

Select the button to open the **Error Log**, then select the help icon in front of each new alarm to read its description and solution.

### 3. Reagent and calibration status

Check the **Reagent** button (yellow = warning, red = error), then open the **Reagent/Calibration** screen.

**Reagent volume colours:**

- **Yellow** — insufficient or expired. **Analysis continues.** Refill or replace.
- **Red** — exhausted, or at least one reagent type is not loaded. **Analysis stops.** Refill or replace.

**Calibration status colours:**

- **Yellow** — calibration factors have been calculated, extended, edited or overridden.
- **Red** — calibration failed or expired, or the chemistry needs calibrating.

Also check the **calibration time left**. If it is about to expire, calibrate now rather than mid-run.

### 4. Maintenance status

If the **Utility** button is yellow, a maintenance procedure is overdue.

1. **Utility > Maintenance > Maintenance**
2. Look for yellow on the *Scheduled Maintenance* tab and the maintenance frequency tabs
3. Open the yellow frequency tab, find the expired procedure, perform it
4. Repeat until nothing is yellow

### 5. Subsystem status

**Utility > Status**, then choose a subsystem tab. Anything abnormal appears in **red**.

| Subsystem | What it tells you | If red |
|---|---|---|
| **Count** | Approximate component usage — useful for predicting failure | Replace the component or call Customer Service |
| **Temperature** | DI water, cuvette washing fluid, wash solution | Exit the software, power-cycle the analyzing unit, restart. If it persists, call Customer Service |
| **Fans** | Reagent refrigeration fans | As above |
| **Hydropneumatics** | Working status of the tanks | As above |
| **Smart modules** | Probes, mixers, carousels, wash station, ISE unit | As above |`,
      },
      {
        title: "Loading Biochemistry Reagents",
        body: `> **Warning:** the probe tip is sharp and can cause puncture wounds. **Biohazard:** wear gloves and a lab coat, goggles if necessary. Do not touch reagent directly — skin wounds or inflammation may result.

Reagents can be loaded in **Standby** or **Incubation** status.

### Open versus closed channels

If the instrument left the factory with open channels configured, those positions accept **Mindray or third-party reagents**. The remaining positions are **closed channels** and accept **Mindray reagents only**. Changing the number of open channels requires Customer Service.

Critically: **open reagents can be loaded manually or by bar code, but closed reagents can only be loaded by bar code scanning.**

### Rules that catch people out

- Chemistries without loaded reagents **can be requested but will not be measured**.
- A chemistry may have multiple bottles, but **all reagent of the same chemistry must be on the same carousel**.
- An **exclamation mark (!)** near a reagent type means one or more reagent types for that chemistry are not yet loaded.
- If a chemistry uses sample pretreatment, the **pretreatment reagent must be on the same carousel** as the chemistry reagent, or the chemistry cannot run.
- Check for **air bubbles** in the bottle before loading — they cause inaccurate results.

### Manual load

Manually entered information is the *only* source of truth for that reagent, so enter it carefully. Manually loaded reagents are flagged with **"M"**. Bar-coded reagent information cannot be edited; for non-bar-coded reagents everything except position, chemistry and reagent type is editable.

**Step 1 — set up reagent information**

1. **Reagent > Reagent/Calibration** (or *Reagent > Reagent Carousel Status*)
2. Choose a reagent carousel from the drop-down
3. Choose the target position and select **Load F1**
4. Enter: bar code, chemistry name, reagent type, lot number, serial number, bottle type, expiration date
5. **Load F3** to save
6. **Prev F1** / **Next F2** to move between chemistries
7. **Print F7** for the reagent list

**Step 2 — load the bottles**

1. Remove the reagent carousel cover
2. Load reagents to the listed positions and **uncap the bottles**
3. Restore the cover
4. **End Load F2**
5. **Inventory F3** to check volumes and refresh tests-left

> **Caution:** if the system is running tests, wait until the status becomes **Reagent load** before removing the cover — otherwise you risk probe collision.

### Auto load (bar code)

1. Remove the carousel cover
2. Place reagents in idle positions and uncap them
3. Restore the cover
4. **End Load F2** — the system scans all positions and reads the bar codes`,
      },
      {
        title: "Special Reagents — ISE Pack, Wash Solutions and Saline",
        body: `### ISE reagent pack

The pack contains calibrator A, calibrator B, a waste container and a volume detection chip. Before running ISE tests you must **load the pack, prime the fluidics, and calibrate**.

1. **Reagent > Reagent/Calibration > ISE Reagent**, select **Load F1**
2. Remove the red caps and push the wand above the top of the pack
3. Align the three pipe adapters at the bottom of the wand with those on the pack, then push down — **the wand only fits one way**
4. Place the connected pack in its mounting position

> **Note:** do not twist, press or squeeze the ISE module pipes during installation — you will clog them.

**Prime and calibrate:** on the *Rgt Load* window enter the purge count in **Purge A/B** (1–50, default **30**), click **Prime**, then select **OK** to calibrate.

### ISE wash solution

Open the sample carousel cover and place it in position **D1 (No. 100)** on the inner ring.

### Diluted wash solution

Diluted from **CD80 alkaline concentrated wash solution** — **1:10 for plastic cuvettes**, 1:50 for glass. Used to clean reaction cuvettes and the mixer.

A **15 L tank lasts 7–8 days** at 840 tests per day.

**To prepare:** pour 1 L of concentrated wash solution into the tank, add deionized water up to the **11 L** mark, fit the cover and shake gently to mix.

**To load:** *Reagent > Reagent/Calibration* → **Dilu W Sol** → **Load F1** → enter volume, serial number, lot number, expiration date and alarm limit → **Load F3** → **Exit F5** → connect the tank to the analyzer interface.

> **Caution:** use only the specified concentrated wash solution. Others cause inaccurate results.

### Probe wash solutions

Both are **manual load only**, and both should be **checked and replaced daily**. Check for air bubbles before loading — they degrade washing.

- **Sample probe wash** → position **D2** on the sample carousel. If the system is Running, press the sample-stop button and wait for the countdown to reach 0 and status to become *Sample Load* before opening the cover.
- **Reagent probe wash** → position **D (No. 92)** on the reagent carousel, via *Reagent > Reagent/Calibration* → **Wash D** → **Load F1**. Enter volume %, serial number, expiration date, lot number, **bottle type (required)** and alarm limit.

### Physiological saline

Used for sample blanks, reagent blanks, calibrations and sample dilution. **Manual load only.** Its position depends on its purpose:

| Purpose | Position |
|---|---|
| Sample blanks and sample dilution | **W (No. 91)**, outer ring of the **reagent** carousel |
| Reagent blanks and calibrations | **W (position 102)** on the **sample** carousel |

> **Caution:** when loading on the reagent carousel during a run, do not remove the cover until the reagent-stop countdown reaches 0, status is *Reagent Load*, and you have confirmed the popup — otherwise probe collision may occur.

### Pretreatment reagent

Used to pretreat whole blood samples. Reagent type is **R0**. For auto loading, stick the bar code from the reagent box onto the bottle before placing it on the carousel. It must sit on the **same carousel** as the chemistry reagent it serves.`,
      },
      {
        title: "Managing Reagents During a Run",
        body: `### Reading the reagent screen

On the biochemistry reagent/calibration screen, reagent names are coloured by state — **yellow** for insufficient or expired, **red** for exhausted or a missing reagent type.

**Sorting** helps you work efficiently. Sort by reagent position, chemistry name, chemistries left, tests left or days left when loading; sort by **calibration time left** or **calibration status** when planning calibrations.

### Loading while Running

Same procedure as loading in Standby, with one addition: you must **pause sample and reagent addition first**.

1. Click **Load F1**
2. Wait until the status changes to **Rgt Load**
3. Replace the reagents exactly as you would for an initial load
4. Resume the test, or start a new one

### Unloading

- Unloading **clears all information and the position**.
- Reagents **currently in use for analysis cannot be unloaded**.
- Reagents requested for QC, analysis or calibration *can* still be unloaded.
- **Bar-coded reagents unload automatically** when removed from the carousel — the manual procedure below is only for non-bar-coded reagents.
- **Diluted wash solution cannot be unloaded at all.** ISE reagent, probe wash solution and saline can.

*Reagent > Reagent/Calibration* → select the reagent → **Load F1** → **Unload F4** → remove the bottle → **Exit F5** → **End Load F2**.

Load the replacement immediately so routine testing is not held up.

### Reagent alarm limit

When a reagent falls below its alarm limit, its name and remaining chemistries turn yellow.

*Utility > Chemistries* → select the chemistry → **Define F1** → down arrow to page 2 → enter the limit (**1–100, default 10**) → **Save F7** → **Close F8**.

### Inventory check

Inventory check is only allowed when the biochemistry system is in **Incubation or Standby**, and the ISE system is Standby, Stopped or unconfigured.

*Reagent > Reagent/Calibration* → **Inventory F3** → choose scope:

- **Following position(s)** — comma-separated, e.g. \`1, 2, 3\` or ranges \`2-15, 20-25\`
- **All positions**
- **All reagents of selected chemistry**

Then **Check**. The carousel graph and the Tests Left / Chems Left / Volume figures refresh.

**Auto refresh:** *Utility > System Setup* → **Instrument F1** → *Reagent/Calibration Setup* → tick **Auto Refresh Reagent Inventory** (off by default). With it on, reagents showing 0 inventory are refreshed as available when you select **End Load F2**.

### Customizing the display

*Utility > System Setup* → **Instrument F1** → *Customize Reagent Display*. Tick the headers you want shown, use **Up** and **Down** to order them, then **Save**.`,
      },
      {
        title: "Running Routine and STAT Samples",
        body: `> **Biohazard:** do not touch samples with bare hands. **Caution:** do not use expired samples. **Note:** check for air bubbles in the sample cup before loading.

**STAT samples run at higher priority than routine samples.**

### Programming a routine sample

1. **Program > Sample**
2. Enter sample ID, carousel number and position, STAT property, sample type, comment, patient ID
3. Select the chemistries and panels to run
4. **Demog F1** for patient information
5. **Options F2** for replicate count and dilution factors
6. **Save F8**

### Programming a STAT sample quickly

1. Select the **STAT** icon at the top right of the main screen
2. Enter sample ID, carousel number and position, sample type, sample cup
3. Confirm the default chemistries — or **Chems F3** to add more, then **Save F7**
4. **Demog F1** / **Options F2** as needed
5. **Save F7**, then **Close F8**

### Preparing and loading

1. **Program > Sample** → **List F5**
2. **Print F7** — samples and controls print separately
3. **Exit F8**
4. Load samples to the carousel **according to the printed list**

### Starting analysis

1. Select the **Start** icon at the top right
2. Choose the sample carousel holding your samples
3. Choose the reagent carousel holding your reagents
4. Choose the patient sample range: **All** or **Partial** (specify a position range)
5. **OK**

### Other ways to program

- **Batch programming** — many samples at once; everything except position, ID and bar code is shared
- **Adding samples** — routine or STAT, at any time
- **Adding chemistries** — to samples in any status; whether program information changes depends on sample status
- **Rerunning** — manual (from the List window, or the Current/History screen) or **automatic**, triggered by the ISE critical range and biochemistry rerun conditions
- **Bar-coded samples with LIS** — no manual entry needed

### Checking results

1. **Result > Current > By Sample**
2. Select the sample on the left; results appear on the right
3. Results **outside the reference range are flagged and shown in yellow**
4. Troubleshoot any flags before releasing

**To print:** select the sample → **Print F7** → *Print Sample Report* → choose **Selected Sample(s)** or **All Sample(s)** → optionally tick **Bypass Printed Sample(s)** → **OK**`,
      },
      {
        title: "Controlling a Run in Progress",
        body: `### Sample carousel status

**Program > Status** shows the test status of every sample position on a carousel graph, with a legend at the lower right.

| Button | Use |
|---|---|
| **Search F1** | Find a calibrator, control or patient sample |
| **Log F2** | Recall controls and samples incomplete within the last 24 hours |
| **Release F3** | Release specified or all positions on the current carousel |
| **Result F4** | Open Current Results — everything programmed and analyzed since startup |
| **Scan F5** | Scan specified or all positions on the selected carousel |

### Reagent carousel status

**Reagent > Reagent Carousel Status** shows reagent volume per position; select a position for detail. Replace insufficient or exhausted reagent immediately. **Load F1**, **End Load F2** and **Inventory F3** work here as elsewhere.

### Switching carousels

**Sample carousels — 10 supported.** Program samples across several to improve throughput. When the current carousel is close to finishing dispensing, a countdown appears and the *Start Conditions* window opens; choose the next carousel, load it, and select **OK** to resume.

**Reagent carousels — 2 supported.** Both can hold biochemistry reagents, wash solution and saline. But:

- Reagents of the **same chemistry must share a carousel**
- **Only chemistries on the same carousel can be tested in one batch**

To run chemistries from the other carousel, open *Start Conditions*, select it, load it, and **OK**.

### Pause

Pause stops sample and reagent **addition** temporarily so you can load or unload. After you click it, the system enters Pause once the started tests finish dispensing. Click the resume icon to continue.

### Emergency stop

Emergency stop **terminates all measurements and invalidates every unfinished test**. Use it only when genuinely necessary — a system failure, for example. It works in any system status.

Select the emergency stop icon → **OK**. All unfinished actions cancel, all pumps and valves switch off, and the system enters **Stopped**.

To recover: **Utility > Commands > Home**. Then select **Start** to resume analysis.`,
      },
      {
        title: "Daily Maintenance and Powering Off",
        body: `### Daily maintenance

Perform the daily procedures plus anything flagged yellow:

- Check probe / mixer / wash well
- Check DI water tank and tube connections
- Check diluted wash solution tank
- Check waste connections
- Check sample syringe and reagent syringe
- Check probe wash solution
- Clean electrode tubes

Level 6 covers each of these in detail.

### Powering off

If you have set the auto startup timer, **skip this procedure entirely.**

1. Confirm the system is in **Standby**
2. **Exit > Shut Down** on the left of the main screen — Windows quits automatically
3. Switch off in this order: **printer → operation unit monitor → analyzing unit power switch**

> **Note:** when the analyzing unit power is switched off, **the refrigeration system keeps running**. Only switch off the MAIN POWER if you are storing the system for **more than 7 days** — otherwise you are deliberately warming your on-board reagents.

### After powering off

1. Remove the sample and reagent carousel covers, then remove calibrators, controls and patient samples
2. Check the analyzer panel for stains and wipe them off with clean gauze
3. Check the high- and low-concentration waste tanks and empty them if needed`,
      },
    ],
    questions: [
      {
        prompt: "After startup, how long should you wait before beginning measurement, and why?",
        options: [
          "About 20 minutes in Standby, so the light source and reaction temperature stabilize",
          "About 5 minutes, so the lamp reaches its operating voltage",
          "No wait is needed once the status reaches Standby",
          "About 60 minutes, so the reagent carousel reaches 2–8 °C",
        ],
        correct_index: 0,
      },
      {
        prompt: "A reagent name appears in RED on the Reagent/Calibration screen. What does that mean?",
        options: [
          "The reagent is exhausted or a reagent type is not loaded — analysis is stopped",
          "The reagent is insufficient or expired, but analysis will continue",
          "The reagent's calibration factors have been edited or overridden",
          "The reagent has been loaded manually rather than by bar code",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which reagents can ONLY be loaded via bar code scanning?",
        options: [
          "Closed-channel reagents",
          "Open-channel reagents",
          "Pretreatment reagents",
          "Physiological saline",
        ],
        correct_index: 0,
      },
      {
        prompt: "How is diluted wash solution prepared for plastic cuvettes?",
        options: [
          "Pour 1 L of CD80 concentrate into the tank and add deionized water to the 11 L mark",
          "Pour 1 L of CD80 concentrate into the tank and add deionized water to the 51 L mark",
          "Dilute CD80 concentrate 1:50 with physiological saline",
          "Use CD80 concentrate undiluted",
        ],
        correct_index: 0,
      },
      {
        prompt: "The system is Running and a biochemistry reagent must be replaced. What must happen before you remove the reagent carousel cover?",
        options: [
          "Click Load F1 and wait until the system status changes to Reagent load",
          "Perform an emergency stop, then remove the cover immediately",
          "Nothing — the cover can be removed at any time during a run",
          "Switch off the analyzing unit power switch first",
        ],
        correct_index: 0,
      },
      {
        prompt: "Where must physiological saline be loaded for running REAGENT blanks and calibrations?",
        options: [
          "Position W (102) on the sample carousel",
          "Position W (91) on the outer ring of the reagent carousel",
          "Position D2 (101) on the sample carousel",
          "Position D (92) on the reagent carousel",
        ],
        correct_index: 0,
      },
      {
        prompt: "What happens to unfinished tests when you perform an emergency stop?",
        options: [
          "They are invalidated, and all pumps and valves switch off",
          "They are paused and resume automatically when you press Start",
          "They finish dispensing first, then the system stops cleanly",
          "They are queued and rerun when the system returns to Standby",
        ],
        correct_index: 0,
      },
      {
        prompt: "You have switched off the analyzing unit power at the end of the day. Is the reagent refrigeration still running?",
        options: [
          "Yes — only switching off the MAIN POWER stops refrigeration",
          "No — refrigeration stops with the analyzing unit",
          "Yes, but only for 24 hours, then it shuts down automatically",
          "Only if the auto startup timer has been set",
        ],
        correct_index: 0,
      },
      {
        prompt: "A chemistry is configured with sample pretreatment. Where must the pretreatment reagent be loaded?",
        options: [
          "On the same reagent carousel as the chemistry reagent",
          "On the sample carousel in position D2",
          "On the second virtual reagent carousel, always",
          "Anywhere on either reagent carousel",
        ],
        correct_index: 0,
      },
      {
        prompt: "When is a reagent inventory check permitted?",
        options: [
          "When the biochemistry system is in Incubation or Standby",
          "At any time, including during a run",
          "Only immediately after an emergency stop",
          "Only when the ISE system is Running",
        ],
        correct_index: 0,
      },
    ],
  },

  // ── Level 3 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 3 — Chemistry & System Configuration",
    category: CATEGORY,
    pass_mark: 75,
    description:
      "The configuration layer: defining open-reagent chemistries and their reaction timing, setting error detection limits, building twin chemistries, calculations and panels, then the system, print, bar code, LIS and user settings that shape how the whole instrument behaves.",
    lessons: [
      {
        title: "Importing and Exporting Chemistries",
        body: `Permitted only for users with sufficient permission, and only when the system is **Standby, Incubation or Stopped**.

> **Caution:** while importing chemistries, **do not switch off the analyzing unit main power or exit the operating software.**

A maximum of **300 open- and closed-reagent chemistries** can be imported. Imported chemistries are **enabled by default** if set up correctly; if the open-reagent count exceeds the maximum, the excess are **disabled**.

### Default chemistry list — closed reagent, .item file

Contains biochemistries, ISE tests and special calculations, plus carryover pairs, reagent type, biochemistry and ISE calibration settings, unit conversion rules, processing parameters, error detection limits, carryover settings, and slope and offset.

**Only the full name, print name, result unit, decimal places and error detection limits are editable** — everything else is read-only.

*Utility > Chemistries* → **Config F3** → **Options** → **Import** → **Load Default** → move chemistries with **Add All>>**, **Add->**, **<-Remove**, **<<Remove All** → **Import** → **Exit**.

> If you change the **result unit**, the chemistry must be recalibrated.

### Specified chemistry list — open reagent, .csv file

Contains biochemistries plus processing parameters, error detection limits, slope and offset. Same flow, but choose **Load** and locate the .csv.

**Recalibrate an imported chemistry if you change any of:** reaction type, primary or secondary wavelength, reaction direction, reaction time, blank time, result unit, standard/diluting sample volume, diluent volume, reagent volume, sample blank, twin chemistries, or pretreatment parameters.

### Exporting

Open-reagent chemistries with their processing parameters, error detection limits, slope and offset can be exported to a storage device.

*Config F3* → **Options** → **Export** → build the export list → **Export** → choose path and filename. The default name is **date and time**, e.g. \`20140827_0951\`, in **.csv** format.`,
      },
      {
        title: "Defining a Chemistry — Processing Parameters",
        body: `Up to **200 chemistries** can be defined. Operations require **Standby, Incubation or Stopped**.

*Utility > Chemistries* → choose a blank frame → **Define F1** → **Biochemistry** (default) → **OK** → set processing parameters and error detection limits → **Save F7** → **Close F8**.

### Naming

| Field | Rules |
|---|---|
| **Chem** (name) | Up to **10 characters**. The chemistry's only identity — **must not be duplicated** |
| **No.** | Unique number, **1–400** for open-reagent chemistries. May be blank, must not duplicate |
| **Chemistry** (full name) | Up to **50 characters**, not case sensitive, may be blank or duplicated |
| **Print Name** | Up to **15 characters**, editable and may duplicate. Appears on **patient reports**. If blank, the short chemistry name is used |

A chemistry appears by its **print name on patient reports** and by its **short name on all other reports**.

### Sample type

Options: **serum, plasma, urine, CSF, other**. Parameters can be defined for more than one sample type.

> **Define parameters for serum first**, then other types — such chemistries are **calibrated with serum parameters by default**.

### Reaction type

| Type | Principle |
|---|---|
| **Endpoint** | Qualitative analysis from the absorption spectrum and absorbed light intensity **once the reaction reaches equilibrium** |
| **Fixed-time** | Reaction velocity is proportional to substrate concentration; as substrate is consumed, velocity and absorbance change rate fall. Takes a long time to equilibrate, so the reaction is only steady **after a delay** |
| **Kinetic** | Continuous monitoring of multiple change points to derive the **initial velocity** of the enzymatic reaction, and from it **enzyme activity**. Mainly for enzyme measurement |

**Reaction direction** — **Positive** = absorbance increases with time; **Negative** = it decreases.

### Wavelengths

**Primary** is chosen from the reactant's light absorption features. **Secondary** corrects the primary measurement, eliminating noise such as light flash, drift and cuvette scratches.

Both offer **340, 405, 450, 510, 546, 578, 630, 670 nm** (secondary also offers *blank*). **The two wavelengths cannot be equal.**

### Units and decimals

- **Closed reagent** — only manufacturer-supplied units. Changing the unit **auto-refreshes** finished results, calibrator and control concentrations, reference ranges and offsets by the conversion rate.
- **Open reagent** — unit is blank by default. After changing it you must **manually update** calibrator concentrations, control concentrations and SDs, reference ranges and offsets. **Results already calculated with the old unit stay unchanged.**

**Decimal** — up to 3 places (0, 0.1, 0.01, 0.001).

### Volumes

| Volume | Range | Increment | Default |
|---|---|---|---|
| Standard sample | 1.5–45 µL | 0.1 µL | 1.5 µL |
| Aspirated (for dilution) | 1.5–45 µL | 0.1 µL | blank |
| Diluent | 75–200 µL | 0.5 µL | blank |
| Decreased / increased sample | 1.5–45 µL | 0.1 µL | blank |
| Reagent R1–R4 | 10–200 µL | 0.5 µL | — |

Three hard constraints:

- **Aspirated + diluent volume must total 125–295 µL**, or the settings will not save.
- **Reagents + reagent diluent + sample must total 100–300 µL** — the reaction mixture volume.
- For concentrated reagent, **R1 reagent + diluent must total 100–200 µL**; R2–R4 total 10–200 µL.

**Reagents must be configured in order:** R2 requires R1; R3 requires R1 and R2; R4 requires R1, R2 and R3. Remove one and every reagent after it is removed too and greyed out.`,
      },
      {
        title: "Reaction Timing — Blank Time and Reaction Time",
        body: `This is the most exacting part of chemistry setup. All three times are counted in **measuring points**, not seconds.

### Definitions

- **Incubation time** — the period between sample addition and R2 addition. **Double-reagent chemistries only.**
- **Blank time** — the period between dispensing the second reactant (in reversed order) and the last reactant.
- **Reaction time** — for **endpoint**, from the reaction start point to the end point; for **fixed-time and kinetic**, from reaction equilibrium to the end of monitoring.

### Point zero

- **Single-reagent chemistry:** point 0 is the measuring point at which **sample** is added.
- **Double-reagent chemistry:** point 0 is the measuring point at which **R2** is added.

### Endpoint analysis ranges

Writing blank time as N–P and reaction time as L–M:

**Blank absorbance read *before* the reaction begins:**

| Reagents | Blank time | Reaction time | K |
|---|---|---|---|
| Single | 1 ≤ N ≤ P ≤ 5 | 7 ≤ L ≤ M ≤ 39 | K1 |
| Double | 7 ≤ N ≤ P ≤ 22 | 23 ≤ L ≤ M ≤ 39 | K2 |
| Triple | 23 ≤ N ≤ P ≤ 47 | 53 ≤ L ≤ M ≤ 86 | |
| Quadruple | 53 ≤ N ≤ P ≤ 68 | 69 ≤ L ≤ M ≤ 86 | |

**Blank absorbance read *after* the reaction begins:** single 7 ≤ N ≤ P, double 23 ≤ N ≤ P, triple 53 ≤ N ≤ P, quadruple 69 ≤ N ≤ P — with **P < L ≤ M** in every case, and K = 1.

**Blank absorbance not subtracted:** **N = P = 0**, K = 0, with reaction time ranges as above.

### Fixed-time and kinetic ranges

Nearly identical, but with **strict** inequalities — 1 ≤ N < P ≤ 5 and 7 ≤ L < M ≤ 39 for single reagent, and so on, with K1–K4 for one to four reagents.

> **The one difference that matters: kinetic analysis requires M − L ≥ 2** — the reaction time must span **at least 3 measuring points**.

### Why this matters

These are not arbitrary bounds. Point 7 is the first measuring point after **sample** is dispensed and stirred; point 23 the first after **R2**; point 53 after **R3**; point 69 after **R4**. Setting a window that starts before its reagent has been added and mixed measures nothing meaningful — which is exactly what the ranges prevent.`,
      },
      {
        title: "Error Detection Limits",
        body: `Each limit produces a specific flag on the patient report. **Leaving a field blank means the check is not performed.**

| Setting | Flag | Applies to |
|---|---|---|
| **Linearity range** | **>** or **<** near the result | All |
| **Linearity limit** | **LIN** | Kinetic only |
| **Substrate depletion** | **BOE** | Kinetic and fixed-time |
| **R1 blank absorbance range** | **RBK** | All |
| **Mixed blank absorbance range** | **MBK** | All |
| **Blank response** | **BLK** | All |

### Linearity range

The measurable range within which the result is linear to the response R. **Take it from the reagent package insert.** Set it separately for standard, increased and decreased sample volumes. Up to 12 digits.

### Linearity limit

For kinetic analysis, absorbance change should be linear with reaction time. Substrate depletion, photometer fluctuation or uneven stirring break that linearity. The system calculates linearity over the measuring period and compares it to your limit.

Any number **0 to 1**, maximum 2 decimals.

### Substrate depletion

**Substrate depletion limit = input limit + K(L1 − Lb)**

- **L1** — primary-wavelength absorbance at the first measuring point after sample is dispensed and stirred in sample analysis
- **Lb** — the same, but in a reagent blank test or 0-concentration calibration
- **K** — liquid volume correction factor

Depletion is deemed to have occurred when the first measuring point's primary-wavelength absorbance is **above** the limit in ascending reactions, or **below** it in descending reactions.

Results are not adjusted when **L1 − Lb ≤ 0**, or when the measurement is not a reagent blank or 0-concentration calibration. **Not applicable to calibrations.** Range **−35000 to 35000**.

### The three blank checks

- **R1 blank absorbance** — allowable range for the maximum absorbance in the period **before sample dispensing**
- **Mixed blank absorbance** — allowable range at the **end point** of a 0-concentration calibrator or reagent blank reaction
- **Blank response** — allowable range for the **response** in that same analysis

All three: **−35000 to 35000**, low limit below high limit, default the full range.

### Other limits on the same page

- **On-board stability** — days a reagent stays valid after first uncapping. **1–999 days**, default blank.
- **Reagent alarm limit** — **1–100**, default 10. **Only definable when sample type is Serum.** No limit means no alarm.
- **Enzyme linear extension** — kinetic only.
- **Prozone check** — six parameters by the rate check method: **Q1, Q2, Q3, Q4, PC, ABS**, in the same units as reaction time. Q ranges follow the reagent count: single 7 ≤ q1 < q2 < q3 < q4 ≤ 39, double from 23, triple from 53, quadruple from 69. **PC** takes 4 decimals; **ABS** is an integer; both range −99999999 to 99999999.

### Pretreatment

Enabled by the **Pretreatment** checkbox, which unlocks common pretreatment, blood cell pretreatment, and calibrator and control pretreatment.

- **Pretreat sample volume:** 1.5–45 µL, increment 0.1 µL, default **4 µL**
- **Pretreatment reagent volume:** 75–200 µL, increment 0.5 µL, default **200 µL**
- **Their sum must be 110–245 µL**

> Pretreatment chemistries **cannot have a predilution factor**. To set pretreatment on a twin chemistry, **remove the twin relation first** — and pretreatment cannot be set on the twin of a latter chemistry at all.`,
      },
      {
        title: "Reference Ranges, Slope/Offset and Qualitative Results",
        body: `### Reference and critical ranges

- **Reference range** — the allowable concentration range of a **normal sample**
- **Critical range** — the allowable result range from the standpoint of **clinical diagnosis**

| Condition | Flag |
|---|---|
| Above the reference range high limit | **^** |
| Below the reference range low limit | **v** |
| Above the critical range high limit | **^!** |
| Below the critical range low limit | **v!** |

*Utility > Chemistries* → **Ref Range F4** → choose chemistry → set **sample type, patient gender and age range** → set the ranges → optionally tick **Auto Rerun** (ISE) → **Save F7**.

Requires sufficient permissions and a **non-Running** system.

**Default range:** only **one** default per sample type and gender per chemistry, shown in **red**. Select a range and click **Set Defaults F1**. The system checks results against the default, flagging and rerunning as configured.

**Deleting:** **Delete F2** for one range, **Del All F3** to clear every range for the chemistry.

### Slope and offset

Compensation factors applied when a chemistry's **QC result deviates slightly**. After measurement the system adjusts every result:

**y = kx + b** — where x is the raw result, y the adjusted result, k the slope, b the offset.

*Utility > Chemistries* → **Slope/Offset F5** → choose chemistry → double-click **Slope**, enter it → double-click **Offset**, enter it → **Save**. **Restore Defaults** returns the factory values.

Requires sufficient permissions and a non-Running system.

### Qualitative results

Available in **Standby, Incubation or Stopped**. Turns a numeric result into a symbolic flag on the patient report.

*Utility > Chemistries* → choose chemistry → **Define F1** → **Qualitative F3** → tick **Use Qualitative Result** → enter range/flag pairs.

**How the ladder works:** enter \`10\` in the first Range box and \`+\` in the first Flag box — any result **≤ 10** is flagged **+**. Enter \`20\` and \`+-\` in the second row — results **> 10 and ≤ 20** are flagged **+-**. The pattern continues; anything **above L5** gets the sixth flag.

The same mechanism is available for **ISE** (per ion — Na, K and Cl each configured separately) and for **off-system chemistries**.`,
      },
      {
        title: "ISE Chemistry and Chemistry Configuration",
        body: `### ISE chemistry

The ISE module measures **K⁺, Na⁺ and Cl⁻** in body fluid by electrode, supporting diagnosis of electrolyte disturbance and body fluid equilibrium.

Applicable to **serum and urine**, default serum. **Urine must be diluted manually before testing.** A sample of any other type is analyzed with the **serum** parameters.

> **ISE chemistry parameters can be viewed by any user in any system status — but cannot be modified or reconfigured.**

| | K⁺ | Na⁺ | Cl⁻ |
|---|---|---|---|
| Unit (serum & urine) | mmol/L | mmol/L | mmol/L |
| Decimal — serum | 0.01 | 0.1 | 0.1 |
| Decimal — urine | 0 | 0 | 0 |
| Range — serum | 1.00–8.00 | 100.0–200.0 | 50.0–150.0 |
| Range — urine | 5–200 | 10–500 | 15–400 |

Only **qualitative flags** can be configured for ISE results.

### Enabling chemistries

**Only enabled chemistries can be requested for measurement or recalled on results screens.**

- **Closed-reagent** chemistries are enabled by default after import
- **Open-reagent** chemistries are enabled only if their parameters are correct
- **ISE chemistries are always enabled** when an ISE module is fitted
- Maximum **200 enabled** chemistries

*Utility > Chemistries* → **Config F3** → select in *Available Chemistries* → **Add->** (or **Add All>>**) → **OK**.

### Disabling chemistries

Disabled chemistries vanish from request screens, and **their results cannot be recalled until they are enabled again**. ISE chemistries and SI can never be disabled.

A chemistry can only be disabled if **all** of these hold:

- It is not an ISE chemistry
- It has **no reagent position**
- It has **no calibrator position** and has not been requested for calibration
- It has **no control position**
- It is not contained in samples or controls in **Programmed, Incomplete or Rerun** status

> Disabled open-reagent chemistries appear in **red**. If you use **<<Remove All** and even one chemistry fails these conditions, **the whole operation is aborted** and nothing is disabled.

### Display order versus test order

These are two different settings and people confuse them.

**Display order** governs where a chemistry appears on the Sample, STAT Sample Program and Quality Control screens. Chemistries list alphabetically by default; with an ISE module, **Na, K and Cl occupy the first three positions after SI**. Use **Home / Up / Down / End** in the Chemistry Configuration window.

**Test order** governs the sequence in which chemistries are actually run. Analysis always proceeds **ISE chemistries → SI → biochemistries**; within the biochemistries, the default order applies unless you change it. *Config F3* → **Options** → **Test Order** → reorder with **Home / Up / Down / End** → **OK**. **Restore Defaults** reverts. Permission-gated.`,
      },
      {
        title: "Twin Chemistries, Calculations and Panels",
        body: `### Twin chemistries

Two chemistries run and calculated from **the same reagent in the same test**.

The manual's example is **HbA1c**: one reagent runs **HB** during the earlier reaction period and **HbA1c** during the later one, and **HbA1c (%)** is derived from both results.

**Setup rules:**

- The chemistry whose result is calculated **first must be defined first**
- **Shared reagent volume and sample volume must be identical** for both
- Only chemistries with **no reagents loaded** can be made twins
- A chemistry that is already someone's twin **must not have another twin**
- **Both twins must be calibrated**

These parameters must be set up **separately** for each twin: sample type, normal/increased/decreased sample volume, volume of the same reagent type, and prozone check.

**Reagent:** set up manually for **one** twin only — the other is assigned the same position automatically. With bar codes, scanning assigns the shared position automatically. **If reagent loading fails for either twin, neither chemistry can run.**

**Calibration and QC:** calibrator, replicate count, auto-calibration conditions and control must be **identical** for both. Requesting either twin **automatically requests the other** — for calibration, QC and sample analysis alike.

**Removing the relation:** deselect the twin chemistry. Only possible when **both reagents are unloaded**.

### Special calculations

Derive new clinically useful chemistries from existing ones — for example **A/G = ALB / (TP − ALB)** or **I-BIL = T-Bil − D-Bil**.

Maximum **50 calculations**. Permission-gated.

*Utility > Chemistries* → **Calculations F6** → **Define F1** → enter abbreviation, full name, sample type, print name, result unit and decimal places → tick **Enable** → build the formula by choosing chemistries and mathematical symbols (**BS** deletes one item, **AC** clears everything) → optionally **Flag qualitative results** → **OK**.

- Calculations are **enabled by default** when defined
- **Calculations are not run for calibration** — only for QC and sample analysis
- If a constituent chemistry has multiple replicates, the **final result** is used
- Only **user-defined** calculations can be deleted, never closed ones

### Panels

A group of chemistries combined for a clinical purpose — liver function, kidney function — to speed up programming. Can contain biochemistries and ISE chemistries. Maximum **100 panels**. Permission-gated.

*Utility > Chemistries* → **Panels F7** → **Define F1** → enter number and name → choose the panel type **Sample**, **QC**, or both (**at least one required**) → choose chemistries (**at least one biochemistry**) → **Save F7**.

**Panels are not run for calibration** — only for sample and control analysis. Deleting a panel leaves its chemistries intact.

### The default panel

**One** default panel may be defined. It is used when a **bar-coded sample has no programming information** on the LIS host and has not been programmed manually — ideal for large volumes of samples all running the same chemistries.

**Only a sample panel can be the default, never a control panel.** Tick the **Default** box beside the panel, then simply load bar-coded samples, press **Start**, choose the carousel and **OK**.`,
      },
      {
        title: "Off-system Chemistries, Carryover, Masking and Reflex",
        body: `### Off-system chemistries

Any chemistry **not run by the analyzer**. You enter the results manually so they appear on the patient report.

- **Qualitative** — no numeric result, only your defined flags. A **reference value** can be set.
- **Quantitative** — numeric results plus flags. A **reference range** can be set.

*Utility > Chemistries* → blank box → **Define F1** → **Off-system** → **OK** → enter abbreviation, full name, ID number, print name, attribute and reference value, result unit and decimal places → optionally configure qualitative flags → **Save F7**.

**To enter results:** program the off-system chemistry on the Sample screen, then *Result > Current* → select the sample → **Options F2** → **Edit Results** → type the results → **Save**. **Off-system results can be edited in any sample status.**

### Carryover setup

Defines contamination relationships between **open-reagent chemistries** and between **cuvettes**, so the system can insert a cleaning cycle for the reagent probe and cuvettes.

**Closed-reagent carryover is set by the manufacturer and can be neither viewed nor edited.** Setting carryover on one twin **updates the other automatically**. Permission-gated, non-Running only.

*Utility > Chemistries* → **Carryover F8** → choose type (**Reagent** or **Cuvette**) → choose the **contaminator** chemistry (or ALL) → choose the **contaminated** chemistry (or ALL) → choose contaminator and contaminated reagent → choose wash type (**special wash** or **routine wash**) → define the **wash cycle** → **Save F7**.

> **ALL-to-ALL is not permitted.** The wash cycle (**1–5**) can only be defined when either the contaminator or the contaminated side is ALL.

### Masking chemistries

Temporarily disables a chemistry — for an abnormal result or exhausted reagent — **without unconfiguring it**. Masked chemistries can be requested but **will not run** until unmasked.

Available in **any system status to any user** — unusually permissive, because it is a fast safety valve.

*Utility > System Setup* → **Instrument F1** → **Mask/Unmask Chem** → select → **OK**. A symbol appears at the chemistry's upper-left corner, and it remains visible on the Sample, Quality Control and Reagent/Calibration screens.

**What happens on unmasking depends on timing:**

| Sample status when unmasked | Result |
|---|---|
| **Programmed** | Runs along with the other chemistries |
| **Being analyzed** | **Added automatically** to the current analysis |
| **Already analyzed** | Runs automatically **when analysis next begins** |

A sample containing masked chemistries finishes in **Incomplete** status.

### Reflex

Automatically requests and runs **related chemistries** when a deciding biochemistry's result falls in a specified range.

Each biochemistry may hold **multiple reflex conditions**, and each condition up to **20 related chemistries**. Viewable by anyone; editable only with permission, and not while Running.

*Utility > Chemistries* → choose chemistry → **Define F1** → **Reflex F2** → tick **Enable Reflex Function** → choose the condition:

- **or** — result greater than value A **OR** less than value B
- **and** — result greater than value A **AND** less than value B

→ enter the concentration range → choose related chemistries → **OK**.

Chemistries already requested for the sample are **excluded** from the reflex trigger. Deleting a chemistry **automatically removes** any reflex relation involving it.`,
      },
      {
        title: "System Setup — Sample Testing and Auto Rerun",
        body: `*Utility > System Setup*. Two pages, switched with the arrow buttons on the right.

### Sample test setup

**Defaults** — default sample type (serum, plasma, urine, CSF, other; default **serum**) and default sample cup type (standard cup or microtube; default **standard**).

**Valid period of samples** — how long after first loading a patient sample stays testable. **1–99**, in hours or days, **default day**. Applies to patient samples only, not calibrators or controls. Counted from the **collection time** if entered, otherwise from the **programming time**. Not set = valid indefinitely.

**Special wash sample probe** — after many tests the sample probe can clog. This runs an extra cleaning cycle every N tests. **100–10000, default 400.**

**Reaction temperature monitoring** — the meaningful setting is *Start Analysis When Temperature is Steady*:

- **Ticked** — the system checks the temperature and **forbids** analysis if it is abnormal.
- **Unticked** — the system still checks (against **37 ± 2.0 °C**) but only **warns** that results may be influenced. You may continue or abort.

**Auto serum index** — selects the SI chemistry by default for serum and plasma samples, measuring hemolysis, icterus and lipemia. Ticking *Qualitative Analysis* prints qualitative SI flags. **Serum index evaluates sample integrity — it is not a patient diagnosis.**

**Alarm when reagent exhausted** — alarms when a chemistry's reagent runs out.

**Manage reagents by lot** — monitors calibration status and time **per reagent lot**. When enabled:

- Lot number becomes **required** when loading manually; a bar-coded reagent with a blank lot number **fails to load**
- Calibration status, requests and results are all **per lot**
- **Auto calibration by bottle or lot is disabled** — instead, a new lot **triggers calibration automatically**
- Lots with valid calibration factors are **not recalibrated** when reused

**Special wash before test** — special wash of sample probe, reagent probes and mixers before each batch.

**Result display settings** — flags and colours for results outside the reference and critical ranges. Flags may be up to **10 characters** of numbers, letters and symbols; defaults are **^** and **v**.

**Reagent alarm limit** — **ISE reagent only**. Range **1–50**, default **5**.

**Alarm sound volume** — separate sliders for **alarm tone** (system alarms) and **beep** (mis-input or mis-operation). Dragging fully left **silences** the buzzer.

> Windows 8 does not support buzzer alarming — an **audio card must be installed** for alarm and beep sound to work.

**ISE prime cycle** — **1–50, default 30**. On startup and whenever a new reagent pack is identified, the ISE module primes automatically to replace its reagents with fresh ones. **Administrators only.**

### Auto rerun setup

Each condition takes a **rerun mode** from a drop-down; leaving one unselected means it is not checked. Requires system setup permission.

| Condition | Trigger |
|---|---|
| **Above Critical High / Below Critical Low** | Result outside the critical range |
| **Above Linearity High / Below Linearity Low** | Result outside the linearity limits |
| **Above Highest Calib. / Below Lowest Calib.** | Response beyond the highest or lowest calibrator |
| **Substrate Depletion** | Substrate ran out during the run |
| **Prozone Check Error** | Prozone occurred during reaction |
| **Nonlinear** | Calculated linearity exceeds the defined linearity limit |
| **No Linear Interval** | ≤ 3 measuring points within the substrate limit — **kinetic only** |
| **No Calculation Interval** | < 2 measuring points within linearity range during high-activity enzyme measurement, even after including lag time — **kinetic only** |`,
      },
      {
        title: "Instrument, Print, Bar Code and LIS Setup",
        body: `### System commands

*Utility > Commands* offers three: **Home** (initializes the biochemistry system and ISE module, returns all components to home position, sets status to **Standby** — the standard recovery from failure), **Stop Print** (clears the print queue; tasks already Printing, Deleted, Canceling or Canceled are unaffected), and **Wake Up**.

### Sleep and Awake

*Utility > System Setup* → **Instrument F1** → **Sleep/Awake**.

**Auto Sleep** — countdown begins when status becomes Standby. Options **N/A, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300** minutes; **default 60**. N/A disables it.

> **Note:** if auto sleep is not enabled, components such as **the lamp age quickly and degrade in performance**. Enabling it is recommended.

**Auto Startup** and **Auto Awake** — any weekday and time from Monday to Sunday. Both require the operation unit and analyzer to stay **connected to power**, or nothing happens.

### Dictionary

Manages frequently used data: **result unit, sample type, sample comment, QC comment**. Editable in any system status; **default options cannot be deleted or edited**. Sample comments can then be typed or picked from the drop-down on the Sample, Levey-Jennings and QC Results screens.

### Communication, language, versions, date/time

**Com Setup** — IP configuration for **PC↔LIS** and **PC↔RMS**. Choose the network adaptor, then *Auto Obtain IP Address* (default) or enter IP address, subnet mask and default gateway. **Check the network cable before applying.**

**Language** — takes effect only after **rebooting the operating software**.

**Version Upgrade** — from a USB disk. **Original data in the database and files is preserved** and remains compatible. **Version Info** shows software version, model and **number of open channels**; **Details** shows smart module versions.

**Date/Time** — formats \`yyyy-mm-dd\`, \`dd-mm-yyyy\`, \`mm-dd-yyyy\`, and 24-hour or 12-hour time.

> Changing date and time **affects reagent and calibration time left, sample shelf life, and two-control evaluation run length**. It cannot be changed while Running. It does **not** affect samples on the Current Results screen, QC evaluation or the Twin-Plot chart.

**Voice Tone Setup** — import audio files from external storage and assign them as the alarm and message tones, with a **Test** button to audition each.

### Print setup

*Utility > System Setup* → **Print F3**.

Auto-print options: **patient reports**, **print after reviewal**, **QC reports**, **calibration reports**. Choose printer type (laser, inkjet, stylus) and the default printer.

**Print mode:** **Paginal** for non-stylus printers (content split across pages) or **Serial** for stylus printers (continuous, no page breaks).

**Templates** — **Edit** opens the Template Modifying Software; **Import** brings in factory templates or your own \`.tmplt\` files from a portable storage device (batch import supported); **Set Defaults** and **Delete** manage the list. A template that is **the default or has a print duty cannot be deleted.**

**Print Order** — reorder chemistries with **Home / Up / Down / End**, and tick or untick **Print** per chemistry to control whether it appears on patient reports.

### Bar code setup

*Utility > System Setup* → **Bar Code F4**. Only available with a bar code reader installed.

Symbologies for both sample and reagent: **Codabar, Interleaved 2 of 5, Code128, Code39, UPC/EAN, Code93**. **Code128 is selected by default and cannot be changed.** Code128, Code93 and UPC/EAN require a check digit by default.

> **Caution:** enable the check function for **all** symbologies to prevent bar code misreads.

**Sample options:** enable sample carousel bar code (scans the whole carousel at test start), auto-numbering of scanned samples (starting from the next available number; resets to **1** daily), extract sample information (**only available when LIS communication is unidirectional**), and STAT positions — a start and end within **1–79 and E1–E11**, marked **E** on the carousel status screen. *Sample Crsl Bar Code* and *Auto Number Scanned Samples* are on by default.

**Sample bar code length:** fixed, or variable within **3–27 digits**. **Interleaved 2 of 5 supports only even-length bar codes** and its digit count must be defined.

**Reagent bar code:** total length **13–30 digits**, broken into fields — chemistry number (0–4), chemistry name (0–10), reagent type (**1 digit: "1" = R1, "2" = R2**), serial number (0–5), bottle type (1–3, one recommended: **1** = Mindray 20 mL, **2** = old 40 mL inner ring, **3** = new 40 mL inner ring), lot number (0–18), expiration date (**0, 4, 6 or 8 digits** — yymm, yyyymm, yyyymmdd).

### LIS setup

*Utility > System Setup* → **Host F5**.

| Parameter | Options / default |
|---|---|
| **Transport** | Serial or TCP/IP — **default Serial** |
| **Serial** | Port **COM1**, data bits 7/8 (**8**), stop bits 1/2 (**1**), parity None/Odd/Even (**None**), baud 300–19200 (**9600**) |
| **Protocol** | **HL7** or **ASTM 1394** |
| **Mode** | **Unidirectional** — send results and demographics only. **Bidirectional** — also download sample programs |
| **Timeout** | **30–60 s**, default 30 s |

Plus **Auto Connect to LIS** at startup, **Retry after Disconnection** (default interval 30 s), and **Send Complete Samples** / **Send Incomplete Samples** — both of which apply **only to samples analyzed on the current day**.

**Advanced options:** send programmed samples, rerun finished chemistries when downloaded again, send actual **and** rerun results (otherwise only the default result goes), bypass results beyond the linearity range, and ignore alarms for unknown chemistries.

> **Channel numbers** identify chemistries on both sides. **They must match between the analyzer and the LIS host** or information cannot transfer correctly.

### Users and permissions

Up to **100 users** across two groups: **Administrator** and **Operator**. Passwords up to **20 characters**, **case sensitive**.

- **Only administrators** may define users, delete users, and assign permissions
- **Username and password can only be modified by that user** — nobody else, including administrators
- Administrators may change the **user group** of themselves and others
- **The currently logged-in username cannot be deleted**

Operators always retain common functions — assigning reagent positions, programming samples, controls and calibrators, and recalling sample, QC and calibration results — plus whatever the administrator grants.

An **Associated Physician** can be linked to a user, becoming the default operator in patient demographics for that login.

### Template Modifying Software

Launched by **Edit** on the Print page, or separately. It creates and edits the print templates that define patient report content and format.

**File menu:** New (**Ctrl+N**), Save (**Ctrl+S**), Save As, Import Image (BMP, GIF, JPEG, PNG, TIFF, EMF), Preview, Exit (**Alt+F4**). *Delete, Import Template, Export Template and Print are not available.*

**Edit menu:** Cut (**Ctrl+X**), Copy (**Ctrl+C**), Paste (**Ctrl+P**), Delete (**Ctrl+D**) — all only active when a control is selected.

> Controls cut or copied can **only be pasted within the same Template Modifying Software instance** — not into another instance or another program.

**Preview** shows the template exactly as it will print, with first/previous/goto/next/last page navigation and zoom at **25%, 50%, 75%, 100%** (default 100%).`,
      },
    ],
    questions: [
      {
        prompt: "What is the required total volume of the reaction mixture (all reagents, reagent diluent and sample)?",
        options: ["100–300 µL", "125–295 µL", "110–245 µL", "10–200 µL"],
        correct_index: 0,
      },
      {
        prompt: "For KINETIC analysis, what additional constraint applies to the reaction time that does not apply to fixed-time?",
        options: [
          "M − L ≥ 2 — the reaction time must span at least 3 measuring points",
          "The blank absorbance must always be read before the reaction begins",
          "The reaction time must start at measuring point 0",
          "Only single-reagent chemistries are permitted",
        ],
        correct_index: 0,
      },
      {
        prompt: "A result is flagged 'BOE' on the patient report. What does that indicate?",
        options: [
          "Substrate depletion occurred",
          "The reaction was non-linear beyond the linearity limit",
          "The R1 blank absorbance was out of range",
          "The blank response was out of range",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which condition must be met before two chemistries can be configured as twins?",
        options: [
          "Neither chemistry has any reagent loaded",
          "Both chemistries are already calibrated",
          "Both chemistries use different reagent positions",
          "Both chemistries have pretreatment enabled",
        ],
        correct_index: 0,
      },
      {
        prompt: "With 'Manage reagents by lot' enabled, what happens to auto calibration?",
        options: [
          "Auto calibration by bottle or lot is disabled; a new lot triggers calibration automatically",
          "Auto calibration runs on every bottle change as well as every lot change",
          "Auto calibration is unaffected",
          "Auto calibration is disabled entirely and must be requested manually",
        ],
        correct_index: 0,
      },
      {
        prompt: "A chemistry is masked while a sample is actively being analyzed, then unmasked during that same analysis. What happens?",
        options: [
          "It is added automatically to the current analysis",
          "It runs when analysis next begins",
          "It is skipped and the sample finishes Incomplete",
          "The analysis restarts from the beginning",
        ],
        correct_index: 0,
      },
      {
        prompt: "In what order does the system run chemistries during sample analysis?",
        options: [
          "ISE chemistries, then SI, then biochemistries",
          "Biochemistries, then SI, then ISE chemistries",
          "Alphabetically by chemistry name",
          "In the display order set on the Chemistry Configuration window",
        ],
        correct_index: 0,
      },
      {
        prompt: "Why does the manual recommend enabling auto sleep?",
        options: [
          "Without it, components such as the lamp age quickly and degrade in performance",
          "It is required for the auto startup timer to function",
          "It prevents the reagent refrigeration unit from overheating",
          "It is needed to keep the LIS connection alive overnight",
        ],
        correct_index: 0,
      },
      {
        prompt: "In an ALL-to-ALL carryover setting, what does the system do?",
        options: [
          "It does not permit ALL contaminator to ALL contaminated to be set up",
          "It applies a routine wash between every pair of chemistries",
          "It applies a special wash with a cycle of 5",
          "It only applies the setting to open-reagent chemistries",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which LIS communication mode allows downloading sample programs from the host?",
        options: ["Bidirectional", "Unidirectional", "Serial", "ASTM 1394"],
        correct_index: 0,
      },
    ],
  },

  // ── Level 4 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 4 — Calibration & Quality Control",
    category: CATEGORY,
    pass_mark: 80,
    description:
      "The two processes that decide whether a result can be trusted. Calibrator setup, math models, acceptance limits, reagent blanks, and the override/extend/reject decisions — then Westgard rules, Levey-Jennings charts and QC evaluation. Higher pass mark: these are result-integrity skills.",
    lessons: [
      {
        title: "What Calibration Actually Does",
        body: `In a calibration the system measures the **response** of a calibrator whose **concentration** is known, then calculates the factors of a concentration–response equation. Once that equation exists, any patient sample's concentration can be derived from its measured response.

That is the whole logic. Everything else in this chapter protects the integrity of that equation.

### The calibration workflow

1. **Request calibration** — ISE test and/or biochemistries
2. **Prepare calibrators**
3. **Start analysis**
4. **Check calibration results** — succeeded? → run QC. Failed? → troubleshoot and act.

### Setup order

Configure in this sequence:

1. Define a calibrator (or import one)
2. Set up calibrator concentrations
3. Set up calibrator dilution (if used)
4. Set up calibration rules
5. Set up calibrator acceptance limits
6. Configure auto calibration

> **You must run calibration again** if you change the calibration model, number of replicates, calibrator concentration, or the calibrators themselves.

Also: **calibrate after changing reagents, after changing electrodes or consumables**, and — as general practice — **at least once every day**.`,
      },
      {
        title: "Defining Calibrators and Concentrations",
        body: `### Defining a calibrator

The system supports up to **99 calibrators**. You may add, edit and delete them only when the system is **not Running**.

1. **Reagent > Cal Setup** → **Define F1**
2. Enter calibrator name, lot number, expiration date
3. Assign positions — **one position per sample carousel**
4. **Save**, then **New** for the next one, then **Close**

> **Note:** calibrators for a given chemistry must be **placed and analyzed on the same sample carousel**.

To edit an existing calibrator, select it and click **Edit F2**.

### Importing a calibrator

Name, lot number, expiration date, per-chemistry concentrations and dilution parameters can all be imported from a **.cif file** on a USB drive.

*Cal Setup* → **Define F1** → **Import** → choose the .cif path → enter the lot number → **OK** → **Close** → assign a position → **Save** → **Close**.

Only .cif files work, each holds **one calibrator**, and only **one can be imported at a time**.

### Setting concentrations

A calibrator is unusable for programming until it has **both a position and a concentration**.

1. **Reagent > Cal Setup**
2. Choose the calibrator on the left
3. **Chems F3** to choose the applicable chemistries
4. Enter the concentration in the **Conc** column — it must be **above 0**
5. Choose the **Unit**
6. **Save F8** — a message confirms parameters changed and calibration is required

### The WATER calibrator

The default calibrator **WATER** has concentration **0 for all chemistries**, no lot number and no expiration date. It **must not be edited or removed**. Every other calibrator can be deleted.

### Calibrator dilution

One calibrator can carry **up to 9 concentrations** for the same chemistry. You enter only the **final concentration of the diluted calibrator** and the **aspirated volume**; the system calculates the diluent and sample volumes itself.

*Cal Setup* → choose calibrator and chemistry → **Dilute F5** → set unit, concentration, aspirated volume, neat sample volume, diluent volume → **Save**.

> Setting up dilution factors for a chemistry **removes its original calibrator concentration**.

### Deleting a calibrator

Deleting clears all calibration settings and the position, and the calibrator can no longer be programmed. Stored results remain recallable **by chemistry name**. Only calibrators that are **not requested or run** can be deleted.`,
      },
      {
        title: "Calibration Rules and Math Models",
        body: `*Reagent > Cal Setup* → **Rules F4**. Choose the chemistry, set the calibration method, K factor and number of replicates, then choose the calibrators.

The **number of calibrators you select determines which math models are available** — this is the table to know.

| Calibration math model | Number of calibrators (N) |
|---|---|
| **K Factor** | N = 0 or 1 |
| **Two-point linear** | N = 2 |
| **Multi-point linear** | 2 < N ≤ 10 |
| **Line** | 2 ≤ N ≤ 10 |
| **Parabola** | 3 ≤ N ≤ 10 |
| **Spline** | 3 ≤ N ≤ 10 |
| **LOG3P** | 3 ≤ N ≤ 10 |
| **Logit-Log 4P** | 4 ≤ N ≤ 10 |
| **Logit-Log 5P** | 5 ≤ N ≤ 10 |
| **Exponential 5P** | 5 ≤ N ≤ 10 |
| **Polynomial 5P** | 5 ≤ N ≤ 10 |

Save with **Save F7**, close with **Close F8**.

### Acceptance limits

Calibration results are compared against limits you define. Exceed them and the system **alarms and flags the results on calibration reports**.

Set these in the *Acceptance Limits* area of the same window:

- **Calibration time**
- **Slope difference**
- **Standard deviation (SD)**
- **Sensitivity**
- **Repeatability**
- **Determination coefficient**

### Auto calibration

The system can decide for itself which chemistries need calibrating and prompt you via status and colour.

*Cal Setup* → **Rules F4** → choose chemistry → tick the conditions:

| Condition | Behaviour |
|---|---|
| **Bottle changed** | Prompts when a different bottle of reagent is used |
| **Lot changed** | Prompts when a different reagent lot is used. **Not available for closed chemistries** — those calibrate automatically on lot change |
| **Calibration time** | Warns **30 minutes before timeout**, showing the chemistry name and status in yellow |

> **Note:** if **Manage Reagents by Lot** is enabled in System Setup, *Bottle Changed* and *Lot Changed* disappear — the system requests and runs calibration automatically whenever a different lot is used.

To switch auto calibration off, deselect all conditions and **Save F7**.`,
      },
      {
        title: "Reading Calibration Status",
        body: `Chemistries in **Cal Required, Cal Failed or Cal Time Out can be requested but will not run.** Check status frequently.

| Status | Meaning | Severity | Colour |
|---|---|---|---|
| **Cal Required** | Not calibrated, auto-cal conditions met, or calibration/chemistry parameters modified | Serious | **Red** |
| **Cal Failed** | Test finished but no final result, or result outside acceptance limits, or requested but errored | Serious | **Red** |
| **Cal Time Out** | Calibration period exceeded | Serious | **Red** |
| **Cal Time Extended** | Period extended; factors usable without time limit | Warning | **Yellow** |
| **Calculated** | Factors have been recalculated | Warning | **Yellow** |
| **Edited** | Factors have been edited | Warning | **Yellow** |
| **Cal Overridden** | Results based on a **failed** calibration, and flagged | Warning | **Yellow** |
| **Requested** | Requested but not started | Normal | none |
| **Calibrated** | Calibrated and within period | Normal | none |
| **N/A** | Reagent has no calibration status | Normal | none |

The rule of thumb: **red stops you, yellow means results carry a caveat.**

### Result flags to recognise

| Flag | Meaning |
|---|---|
| **CALR** | Calibration factors were **recalculated** |
| **CALE** | Results calculated from **edited** factors |
| **EXT** | Results calculated from **time-extended** factors |
| **OVE** | Results calculated from **overridden (failed)** factors |
| **CALJ** | Current calibration **rejected**; the last valid factors were used |`,
      },
      {
        title: "Reagent Blank",
        body: `In a reagent blank test the reagents react with physiological saline or a **zero-concentration calibrator**, and the blank absorbance is calculated.

### Why it exists

When a reagent has been **uncapped for a long period**, its absorbance drifts. Rather than repeating a full calibration, you can run a reagent blank to recompute the blank absorbance, which **adjusts the existing calibration factors** — keeping sample results reliable at much lower cost.

### Conditions

Reagent blank is permitted **only in Calibrated status** — that is, only when calibration has already succeeded. In addition:

- Chemistries using any math model **other than** two-point linear and K factor must have a **0-concentration calibrator** set up.
- **K factor chemistries** must have calibrators set up.

### The two acceptance ranges

- **Mixed blank absorbance** — allowable range for the absorbance measured at the **end point** of a zero-concentration calibrator or reagent blank reaction.
- **Blank response** — allowable range for the **response** in that same analysis.

Out of range on either, and the result is flagged.

Set both at *Utility > Chemistries* → choose the chemistry → **Define F1** → fill *Mixed Blank Abs* and *Blank Response* → **Save F7**.

### Running it

1. **Reagent > Reagent/Calibration**, choose the reagent carousel
2. Show the biochemistry reagent/calibration screen
3. **Confirm the chemistries are in Calibrated status**
4. Select the chemistries → **Cal F5** → choose **Rgt Blk** → **OK**
5. Select the **Start** icon

### Outcome

- **Within acceptance limits** → the system updates the calibration factors **and the remaining calibration time**.
- **Outside limits** → alarm, and you are asked to rerun the reagent blank.

Recall the response, absorbance and run date on the **Biochemistry Calibration** screen via **Reac Curve F3**. Note that a **calibration curve for a reagent blank cannot be recalled** — only the reaction curve.

Trends available via **Trend F6**: R1 blank absorbance, mixed blank absorbance, calibrator response, and K factor (linear calibrations only).`,
      },
      {
        title: "Working With Calibration Results",
        body: `**Reagent > Biochemistry Calibration** → *History* option → choose chemistry → set the **Cal Date** range → **Search F1**.

### Calibration curve — Cal Curve F2

Shows the mathematical relation between calibrator concentration and response: a **straight line** for linear calibrations, a **curve** for nonlinear ones.

> **K-factor, edited and reagent-blanked calibration factors have no recallable calibration curve.**

### Reaction curve — Reac Curve F3

Shows absorbance at the primary wavelength, secondary wavelength and primary-minus-secondary, plotted across the reaction period. Select any point to see its measuring period and absorbance.

Filters: **None**, **Chemistry**, or **Calibrator**. Supporting buttons: **Reagent F1** (calibrators and reagents used), **Sample Blank F2**, **Adjust F3** (absorbance display range), **Prev/Next**, **Print F7**.

### Recalculating — Recalculate F6

Recalculate factors from existing data using a **different math model and calibrator selection**. Available for results in Calibrated, Cal Failed, Cal Time Out, Extended or Overridden status.

Two hard limits:

- **Not applicable to K factor calibrations.**
- **Factors that have already been recalculated cannot be recalculated again.**

Success gives status *Recalculated* and the flag **CALR**. Failure leaves the old factors in place.

### Editing factors — Edit F4

If linear calibration factors are higher or lower than expected — or than the same test on another instrument — you can type in **slope K** and **offset R0** directly.

Requirements: sufficient permissions, and the system **not Running**. Results are flagged **CALE**, and neither the calibration curve nor the reaction curve can be recalled afterwards.

### Trends — Trend F6

Summarize a chemistry's calibrations over time: **R1 blank absorbance**, **mixed blank absorbance**, **calibrator response**, and **K factor** (linear only). The two blank-absorbance trends require a 0-concentration calibrator. View as graph or **Tabular Trend**.

### Archiving — Archive F5

Archives all searched results to a USB drive as a **.csv named by date and time**. Contents: chemistry name, flag, calibration status, R0, K factor, coefficients A/B/C/D, and calibration time.`,
      },
      {
        title: "Extend, Override and Reject — the Three Escape Hatches",
        body: `All three let you keep testing when calibration is not clean. All three flag their results. **Understand the cost of each before using it.**

### Extend calibration time → flag EXT

Expired factors cannot calculate results; status becomes *Cal Time Out* and the chemistry stops running. The system warns **30 minutes before** timeout.

If you are **certain the factors are still correct and valid**, extend their validity indefinitely.

*Reagent > Reagent/Calibration* → biochemistry screen → choose the chemistry → **Cal Options F8** → **Extend Calibration Time** → **OK**.

Only available when the current calibration is **timed out or succeeded**. To remove the extended status, **recalibrate**.

### Calibration override → flag OVE

Override lets the system calculate results from a **failed** calibration's factors. It applies **only to failed calibrations**.

> **Caution:** before overriding, make sure the calibration factors are within **your laboratory's** acceptance limits and that the magnitude of the error is entirely under your control. Use of overridden factors may lead to unreliable results and **influence the doctor's diagnosis**. Think twice.

*Cal Options F8* → **Calibration Override** → **OK**. Remove by recalibrating.

### Reject → flag CALJ

If the current calibration fails but analysis must proceed immediately, **Reject** discards the current factors and falls back to the **most recent valid ones**.

Factors in any status **except Requested and Cal Required** can be rejected, and **rejected factors cannot be rejected again**.

*Cal Options F8* → **Reject** → **OK**. Remove by recalibrating.

### Choosing between them

| Situation | Use |
|---|---|
| Factors are good, the clock ran out | **Extend** |
| Calibration failed, but the error is small and characterized | **Override** |
| Calibration failed, and you trust the previous calibration more | **Reject** |

Every one of these is a temporary measure. **Recalibrating is the only thing that clears the status.**`,
      },
      {
        title: "ISE Calibration",
        body: `ISE calibration is much simpler than biochemistry calibration — two settings and a status table.

### Setup

*Reagent > Setup* → **Rules F4** → select **ISE** from the Chemistry list.

- **Cal Time** — range **1–9999**, default **8 hours**. Leaving it blank means the factors never expire.
- **Auto Calibration** — tick the box and enter an interval of **1–24 hours** (default blank).

**Save F7**, **Close F8**.

An **expired calibrator is shown in yellow and cannot be used** for calibration.

### ISE calibration status

| Status | Meaning | Severity | Colour |
|---|---|---|---|
| **Cal Required** | Not calibrated, **or the ISE reagent/electrode was replaced** | Serious | **Red** |
| **Cal Failed** | Factors calculated but outside acceptance limits, or none calculated | Serious | **Red** |
| **Cal Time Out** | Period exceeded, **or a reagent of different serial/lot number is in use** | Serious | **Red** |
| **Cal Time Extended** | Period extended; factors usable without time limit | Warning | **Yellow** |
| **Requested** | Requested, not finished | Normal | none |
| **Calibrated** | Successful and within period | Normal | none |
| **N/A** | Reagent not loaded | Normal | none |

Note the two ISE-specific triggers: **replacing an electrode forces Cal Required**, and **changing reagent serial or lot forces Cal Time Out**.

### Recalling results

*Reagent > ISE Calibration* → **History** → date range → **Search F1** → **Print F7** for a report.

- **Trend F6** — choose trend type and date range, then **Search F1**. Note that **Reference Electrode is not offered when recalling ISE Urine trends**.
- **Archive F5** — archives both current and earlier factors as a **.csv** named by date and time.
- **Extend calibration time** — same mechanism as biochemistry, via *Reagent/Calibration* → **Cal Options F8**. Only when the current calibration is timed out or succeeded; recalibrate to remove.`,
      },
      {
        title: "Quality Control — Setup and Rules",
        body: `QC runs samples of **known concentration range** supplied by an authority or reagent manufacturer. Comparing your results against that range tells you whether the instrument is behaving and whether patient results can be trusted.

**Run controls every time you calibrate, change a reagent lot, or maintain or troubleshoot the instrument** — and every day as routine.

### The QC lifecycle

**Set up once:** define controls → choose QC rules → set QC parameters → set up two-control evaluation → enable auto QC.

**Daily:** load controls → program controls → run them → recall results → print real-time results.

**Monthly:** print the monthly QC plot and QC summary.

### Defining a control

Up to **99 controls**. Controls can be deleted while the system is in **non-test status**.

*QC > QC Setup* → **Define F1** → enter name, number, lot number, expiration date, sample type → assign **one position per sample carousel** → **OK**.

> The combination of **control name and lot number must be unique**. If a control has no lot number, you cannot define another control with the same name.

### Setting concentrations

**Both position and concentration are required** before a QC test can be requested.

*QC Setup* → choose the control → **Chems F2** to pick chemistries → enter **Mean** and **SD** per chemistry → choose the unit (**not editable for open-reagent chemistries**) → **Save F8**.

### QC rules

*QC Setup* → **Rules F3** → choose chemistry → tick the **Westgard rules** → select the cumulative sum control limit.

> Controls **without** a QC rule can still be programmed and analyzed — they simply **are not monitored for error detection**. That is a silent failure mode worth remembering.

**Two-control evaluation:** if you have assigned a pair of controls to a chemistry, enable it and nominate **Control (X)** and **Control (Y)**. Controls not part of the pair continue to be monitored by the Westgard rules.

Rules can be changed whenever the system is not running tests.

### Deleting a control

Deleting clears control information, concentration parameters, **QC results** and the position — and **disables any two-control evaluation** that used it. Controls programmed for analysis cannot be deleted.`,
      },
      {
        title: "Auto QC, Control Status and Reading QC Results",
        body: `### Auto QC

*Utility > System Setup* → **Instrument F1** → **QC Evaluation** → tick **Auto QC on carousel**.

Two trigger conditions:

- **Number of Samples** — after this many patient samples, the selected controls run automatically. Range **10–500**; **0 disables** auto QC.
- **When Calibrated** — controls run every time the chemistry is calibrated. **Not applicable to non-measurement calibrations** such as recalculation and editing.

When an auto QC run fires, **all chemistries configured for the selected controls are run**. Clear the settings on the QC Parameters window to disable it.

### Control status

Shown in the *Sample Status* field on *Program > Quality Control*.

| Status | Meaning |
|---|---|
| **N/A** | Not programmed for analysis |
| **Requested** | Programmed, not yet analyzed |
| **In Progress** | Being analyzed |
| **Incomplete** | All chemistries finished, but one or more produced **no result** |
| **Complete** | All chemistries finished **with results** |

### QC failure flags

A failed QC triggers an **audible alarm** and an on-screen message. Flags in the QC report's Flag column:

**1-3s · 2-2s · R-4s · 4-1s · 10-x**

The system also classifies the failure:

- **\`#\`** — a **systematic** error
- **\`*\`** — a **random** error

### The four QC views

**Levey-Jennings — QC > Levey-Jennings**
QC date (X) against test result (Y), showing trend over a period. Up to **3 controls** per chart in different colours, **31 QC points per page**, and the query range must not exceed **1 year**. Use **Chart F3** to set the drawing mode, **Delete F6** to remove a point (tick *Show Deleted* to see removed ones), and **Comment F8** to annotate a point.

**Cumulative sum — QC > Cumulative sum**
Same workflow: choose chemistry, date range and controls, then **Search F1**. Points can be deleted and commented in the same way.

**Twin-Plot — QC > Twin-Plot**
Plots control X against control Y **from the same run** to separate **systematic from random error**. Shows the **most recent 10 results**, excluding deleted points.

**Results — QC > Results**
The raw data view: QC results alongside the configured mean and SD, recallable by control, chemistry and run date. **Sort F3** by control or chemistry, **Reac Curve F4** for the reaction curve, **Comment F5** to annotate (**up to 100 characters**), **Archive F6** to export.

**Summary — QC > Summary**
Reports **mean, standard deviation and coefficient of variation** for a control and chemistry over a period, compared against the configured mean and SD. This is the view that answers "is the system working normally?" over time rather than run by run.

### History results

*Result > History* recalls patient and control results from **before the current day**, by sample or by chemistry. **Options F2** deletes or archives, **Reac Curve F4** shows the curve, **Host F8** transmits results to the LIS.`,
      },
    ],
    questions: [
      {
        prompt: "You have selected 4 calibrators for a chemistry. Which math model becomes available that would NOT be available with 3?",
        options: ["Logit-Log 4P", "Parabola", "Spline", "Two-point linear"],
        correct_index: 0,
      },
      {
        prompt: "What does the flag OVE on a patient result indicate?",
        options: [
          "The result was calculated from the factors of a FAILED calibration that was overridden",
          "The result was calculated from calibration factors whose validity period was extended",
          "The calibration was rejected and the previous valid factors were used",
          "The calibration factors were manually edited",
        ],
        correct_index: 0,
      },
      {
        prompt: "Under what calibration status is a reagent blank test permitted?",
        options: [
          "Calibrated — calibration must already have succeeded",
          "Cal Failed — the reagent blank replaces the failed calibration",
          "Cal Required — the reagent blank substitutes for a first calibration",
          "Any status except Requested",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which calibrator must never be edited or removed, and what is its concentration?",
        options: [
          "WATER, with concentration 0 for all chemistries",
          "The first calibrator defined, with concentration 1 for all chemistries",
          "The imported .cif calibrator, whose concentration is fixed",
          "Calibrator S1, with a chemistry-specific concentration",
        ],
        correct_index: 0,
      },
      {
        prompt: "A control has been defined and programmed but no QC rule was set for the chemistry. What happens?",
        options: [
          "It runs and produces results, but is not monitored for error detection",
          "It cannot be programmed until a QC rule is set",
          "It runs, and the system applies default Westgard rules automatically",
          "It is flagged Incomplete and produces no result",
        ],
        correct_index: 0,
      },
      {
        prompt: "In a QC report Flag column, what does a '#' sign indicate?",
        options: ["A systematic error", "A random error", "A deleted QC point", "A result outside the reference range"],
        correct_index: 0,
      },
      {
        prompt: "Which two events force an ISE chemistry into a red calibration status?",
        options: [
          "Replacing the ISE electrode (Cal Required) and using a reagent of different serial/lot number (Cal Time Out)",
          "Loading a new sample carousel and exceeding 24 hours since startup",
          "Running auto QC and extending the calibration time",
          "Priming the fluidics and changing the purge count",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which calibration results CANNOT be recalculated?",
        options: [
          "K factor calibrations, and factors that have already been recalculated once",
          "Any calibration in Cal Failed status",
          "Any calibration older than 30 days",
          "Calibrations using more than 5 calibrators",
        ],
        correct_index: 0,
      },
      {
        prompt: "What does the Twin-Plot chart show, and how many results does it display?",
        options: [
          "Control X against control Y from the same run, showing the most recent 10 results",
          "QC date against result for up to 3 controls, showing 31 points per page",
          "Cumulative sum of deviations for one control over one year",
          "Mean, SD and CV compared against configured values",
        ],
        correct_index: 0,
      },
      {
        prompt: "Auto QC is set with 'Number of Samples' = 0. What is the effect?",
        options: [
          "Auto QC is disabled",
          "Auto QC runs before every single patient sample",
          "Auto QC runs once at startup only",
          "The setting is invalid and the system reverts to 10",
        ],
        correct_index: 0,
      },
    ],
  },

  // ── Level 5 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 5 — Sample Programming & Results",
    category: CATEGORY,
    pass_mark: 75,
    description:
      "Everything between the tube and the report: loading samples, programming them by hand, by batch, by bar code or from the LIS, rerunning them automatically, and then recalling, editing, compensating, archiving and reporting the results.",
    lessons: [
      {
        title: "Sample Containers, Volume and Handling",
        body: `### Supported containers

**Microtubes** — Φ14×25 mm 0.5 mL (Beckman), Φ14×25 mm 2 mL (Beckman), Φ12×37 mm 2 mL (Hitachi).

**Blood collecting or plastic tubes** — Φ12×68.5 mm, Φ12×99 mm, Φ12.7×75 mm, Φ12.7×100 mm, Φ13×75 mm, Φ13×95 mm, Φ13×100 mm.

For **centrifuged whole blood**, only the blood-collecting/plastic tube sizes are permitted, and they must be **anticoagulation tubes**.

- Sample height **no higher than 55 mm**
- Blood cell level **no lower than 10 mm**
- **Microcups are not allowed**
- **EDTA anticoagulation tubes are recommended** for clinical performance and to avoid system alarms

### Sample volume

Routine measurement takes **1.5–45 µL in 0.1 µL increments**.

> If a sample is **exhausted during analysis, the system automatically invalidates every incomplete chemistry for that sample.** Check volumes before you start — this is a common cause of lost work.

### Loading

1. Confirm sample volume is sufficient and the bar code label is applied correctly
2. Check system status — if **Running**, request a **sample stop**; if Standby or Incubation, continue
3. Confirm the **sample carousel and probe have stopped moving**
4. Remove the sample carousel cover
5. Insert the tube until its bottom contacts the groove of the tube rack
6. Close the cover

### Unloading

Same discipline in reverse: confirm the carousel and probe have stopped, request a sample stop if Running, remove the cover, pull the tube upward out of the holder, close the cover.

> **Biohazard:** gloves and lab coat throughout, goggles if necessary.`,
      },
      {
        title: "Programming Samples with LIS",
        body: `When connected to a LIS, the system can obtain programs automatically or download them on demand.

### Automatic

With the system in **Standby or Pause**, load the samples and select the **Start** icon. The system scans the samples, queries the LIS host for their program information, matches it to the samples, and begins analysis. No manual entry at all.

### Manual download — bar-coded samples

1. **Program > Sample** → **List F5** → **Download F7**
2. Choose the scope:
   - **All programmed samples** — everything programmed today
   - **Latest samples** — programmed today but not yet downloaded
   - **Samples with the following IDs** — specify program date and ID or ID range
   - **Sample with the following bar code** — specify one bar code
3. **OK**, then confirm the sample information and chemistries on the Sample List screen
4. Load the samples into **idle positions**
5. **Start** icon → set test conditions → tick **Sample Crsl Bar Code** → **OK**

### Manual download — non-bar-coded samples

These arrive **unpositioned** and cannot be analyzed until they have positions.

1. After downloading, select **List F5** → **Unpositioned F2** → **Assign**
2. Choose the program date
3. Enter the sample ID or ID range
4. Choose the sample carousel
5. Enter positions — one number for a single sample, or a **start and end position** for several. The system assigns positions **ascending by sample ID**
6. **OK**, load the samples to the assigned positions
7. **Start** icon → set conditions → **OK**`,
      },
      {
        title: "Bar-coded Samples Without LIS",
        body: `Three preconditions before any of this works:

- The **sample bar code reader is configured**
- The **Sample Crsl Bar Code** check box on the Sample Bar Code window is **selected**
- The system status is **Standby or Pause**

### Method 1 — scan at start

1. Program the samples manually as usual
2. Place the bar-coded samples **sequentially** on the sample carousel
3. Select the **Start** icon
4. Choose the sample carousel
5. Tick **Sample Crsl Bar Code**
6. Specify the range: **All** or **Partial** (with a position range)
7. **OK** — the system scans, matches the program information, and starts

### Method 2 — scan first, then start

1. Program the samples manually
2. Place them sequentially on the carousel. If **auto numbering** is enabled, the system numbers them in placement order, starting from the next available number after the last programmed sample
3. **Program > Status** → **Scan F5**
4. Choose the scanning range — **All positions**, or **Specified positions** with a start and end
5. **OK**
6. **Start** icon → set conditions → **OK**

The difference is *when* the scan happens: Method 1 scans as part of starting the run, Method 2 scans up front so you can verify the match before committing.`,
      },
      {
        title: "Batch Programming, Adding Samples and Chemistries",
        body: `### Batch programming

For a batch, **everything except position, ID and bar code is identical** across the samples.

1. **Program > Sample**
2. Enter the **first** sample ID
3. Enter the **start position**
4. Set STAT property, sample type, comment, patient ID
5. Choose the chemistries
6. **Demog F1** for demographics, **Options F2** for replicates and dilution factors
7. **Batch F3**, enter the **last** sample ID, **OK**
8. **Start** icon → set conditions → **OK**

### Adding samples

Routine samples, STAT samples, **calibrators and controls** can all be added at any time and tested exactly like a routine run.

**While Running:**

1. Program the sample as normal
2. Select the **Pause** icon
3. Once the status becomes **Pause**, place the samples in their assigned positions and select **Resume**
4. If they are on the current carousel, **OK** starts the test. Otherwise specify the carousel and position

**In any other status:** program, place, then **Start** icon → conditions → **OK**.

### Adding or modifying chemistries

**Chemistries can be added or removed no matter what status a sample is in.**

1. **Program > Sample**
2. Type the sample ID and press **Enter** — its programming appears
3. Deselect what you do not want, select what you do (chemistries and panels)
4. **Save F8**

If the system is **running**, the added chemistries and panels are analyzed **automatically**. If it is in **Standby**, use the Start icon to begin.`,
      },
      {
        title: "Rerunning Samples",
        body: `Rerun handles samples with abnormal results, or results outside the linearity or critical range. There are manual and automatic paths.

| Path | Where |
|---|---|
| Manual — single or batch | *Program > Sample > List* window |
| Manual — by sample or chemistry | *Result > Current* or *History* |
| Auto — ISE | *Utility > Chemistries > Reference/Critical Range* |
| Auto — biochemistry | *Utility > System Setup > Auto Rerun Setup* |

### Manual rerun from the List window

Handles samples in **Complete, Incomplete, Rerun or In Progress** status.

Editable on rerun: sample cup type, position, STAT flag, comment, chemistries and panels. For a finished chemistry you may also change sample volume, replicates and predilution factor.

**Never editable:** sample ID, bar code, sample type, collection time.

*Program > Sample* → **List F5** → **Rerun F4** → type the ID or bar code → **Select** → edit → **Save F8** → **Exit F7** → load samples → **Start**.

**For a batch:** enter IDs separated by commas (\`5, 7, 9\`) or a range with a dash (\`1-3\`), select **Batch**, choose the chemistries to rerun, **OK**.

### Manual rerun from Current or History

Handles samples in **Complete or Incomplete** status that have finished testing. **Rerun F5**.

**By sample** — modify carousel/position, sample volume, sample cup, off-line dilution factor, predilution factor and sample blank for all chemistries; or volume, predilution, sample blank and pretreatment for a single chemistry.

**By chemistry** — tick *Sample Blank* for all samples, or set volume, predilution, off-line dilution, sample blank and pretreatment per sample.

### Auto rerun — ISE

*Utility > Chemistries* → **Ref Range F4** → select **ISE** → set the critical range plus sample type, patient gender and age range → tick **Auto Rerun** → **Save F7**.

The system reruns whenever an ISE result falls **outside the critical range**.

### Auto rerun — biochemistry

Two halves. First, enable it per chemistry and define what counts as an error:

*Utility > Chemistries* → choose chemistry → **Define F1** → tick **Auto Rerun** → down-arrow to the error detection page → set **linearity range** (standard, decreased and increased volumes), **linearity limit**, **substrate depletion limit**, **mixed blank absorbance**, **R1 blank absorbance**, **blank response**, and **prozone check parameters (Q1–Q4, PC, ABS)** → **Save F7**.

Then set the trigger conditions: *Utility > System Setup* → auto rerun setup screen → tick the conditions and choose a **rerun sample volume** → **Save F8**.

### Recalling rerun results

*Result > Current* or *History* → choose sample and chemistry → **Options F2** → **Recall Rerun Results**.

**The latest rerun is the default.** To promote a different one, select it and click **Set Defaults** — the Default column shows **Y**.`,
      },
      {
        title: "Sample Blank and Whole Blood Testing",
        body: `### Sample blank

A sample blank runs like a normal analysis but substitutes an **equivalent amount of physiological saline for the reagent**. Its purpose is to remove non-chromogenic reaction — chiefly the effect of **hemolysis, icterus and lipemia** on absorbance readings.

> **Sample blank is only effective for single-reagent endpoint chemistries.**

**To enable:** *Utility > Chemistries* → choose chemistry → **Define F1** → tick **Sample Blank** → **Save F7** → **Close F8**. The system then runs a sample blank whenever it runs calibrators, controls and samples for that chemistry.

**To view:** *Result > Current* or *History* → choose sample and chemistry → **Reac Curve F4** → **Sample Blank F2**.

### Whole blood testing

Whole blood chemistries are ordinary biochemistries in every respect — parameters, calibration, reagent loading — **except that a pretreatment reagent must be set up and loaded**.

**Preparing the sample:** centrifuge at **2000 rpm for 5 minutes**, then load into the sample positions. The container rules from lesson 1 apply strictly: anticoagulation tubes only, sample height ≤ 55 mm, blood cell level ≥ 10 mm, no microcups, EDTA recommended.

**Configuring the chemistry:**

1. *Utility > Chemistries* → choose the chemistry → **Define F1**
2. Select **Sample pretreatment**, then **common pretreatment** or **blood cell treatment**
3. Enter **Pretreat sample Vol** and **Pretreat reagent vol**
4. **Save F7**, **Exit F8**
5. Confirm the reagent **and** pretreatment reagent are loaded, and that the reagent is calibrated

**Programming:** *Program > Sample* → enter ID, position, STAT, **sample type = Other**, comment, chemistry and panel → set options (sample volume, cup, replicates, off-line dilution, predilution, sample blank, pretreatment) → **Save F8** → **Start**.

### Turning pretreatment off for one run

Selecting sample pretreatment on the **chemistry parameter screen** makes **every** test of that chemistry pretreat. If a sample has already been pretreated manually — or results come back abnormal — deselect pretreatment on the **chemistry options window** or the **rerun window** to test it without.`,
      },
      {
        title: "Managing the Sample Queue",
        body: `### Clearing samples

Clears programmed samples that **have not been analyzed**. All sample information is removed completely and the **ID, position and bar code become reusable**. The action is recorded in the **edit logs**.

*Program > Sample* → **Clear F4** → choose *Current sample* or *Sample(s) with following ID(s)* (single ID or range) → **OK**.

### The List window

**Sample List** shows all patient and control samples **programmed but not yet analyzed**. From here you can search, assign positions, download from LIS, rerun and print.

**Search F1** filters by program date, sample status (**All, Programmed, In Progress, Incomplete, Complete, Rerun**), sample ID or range — or by bar code.

**Chemistry List** summarizes chemistries requested today, plus older requests not yet finished, with their calibration status, reagent status, tests left and request count.

### Unpositioned samples

Three ways a sample ends up unpositioned:

1. **Downloaded from LIS** and not yet positioned — cannot be analyzed until assigned. *(Exception: with a sample bar code reader fitted, they can be analyzed immediately without assignment.)*
2. **Incomplete** when their position is reused for a new sample
3. **Incomplete** when their position is released

Once positioned, they leave the list. *List F5* → **Unpositioned F2** → **Assign** → date, ID or range, carousel, position(s) → **OK**.

### Releasing sample positions

**A position cannot be reused for a new sample until it is released.** Results and programming information remain recallable after release.

Only **patient samples** can be released — never controls, calibrators, ISE wash solution or physiological saline. Positions currently running a test are excluded.

**Manual:** *Program > Status* → choose carousel → **Release F3** → *Following position(s)* (single or range) or *All positions* → **OK**.

**Automatic:** *Utility > System Setup* → **Instrument F1** → **Auto Release Sample** → set **Auto Release Time** (integer **00–23**, default **00**) → **OK**. At that hour every day, all positions in **Complete** status are released.

### Sample logs

*Program > Status* → **Log F2** lists controls and patient samples **incomplete within the last 24 hours**, so you can rerun them or act. **Print F7** to print, **Exit F8** to close.`,
      },
      {
        title: "Customizing the Sample and Result Display",
        body: `All four of these live under *Utility > System Setup* → **Instrument F1**, and all of them are worth configuring once rather than fighting the defaults daily.

### Customize sample information

**Cust. Sample Info** chooses which sample fields appear on the Sample screen. Tick the *Customize* checkbox beside each field you want, **Save**, **Exit**.

### Customize patient demographics

**Patient Demographics** controls which demographic fields appear, their default values and their order.

- Select the information and default value → **Add**
- Select an entry → **Delete** to remove it
- **Up**, **Down**, **Home**, **End** to reorder
- **OK** to save

### Optimize result display

Some reagents have low sensitivity, so low-concentration samples can produce **0 or negative results**, or values outside the linearity range that cannot be expressed accurately. This option replaces such numbers with a bounded expression.

| When the result is… | It is displayed as… |
|---|---|
| Below the linearity low limit | **< low limit of linearity range** |
| Above the linearity high limit | **> high limit of linearity range** |
| Below the lowest calibrator concentration | **< lowest calibrator concentration** |
| Above the highest calibrator concentration | **> highest calibrator concentration** |
| Below **both** the linearity low limit and the lowest calibrator concentration | **< the maximum of the two values** |
| Above **both** the linearity high limit and the highest calibrator concentration | **> the minimum of the two values** |

**Optimizing does not affect storage, transmission or archiving** — only display. Only users with system setup permission may change it.

*Optimize Result Display* → tick **Low** and **High** per chemistry (or **Select All** / **Clear**) → **Save**.

### Customize result display

*Result > Current* or *History* → **Options F2** → **Customize Result Display**.

Recalling **by sample** lets you customize both the sample list and the result list; recalling **by chemistry** lets you customize the result list only. Deselect a header to hide it, and use **Up** / **Down** to reorder.`,
      },
      {
        title: "Recalling and Reviewing Results",
        body: `**Current** = programmed and analyzed **today**. **History** = programmed and analyzed **before today**. Both recall **by sample** or **by chemistry**.

> Every operation works on both screens **except Recalculate, which is Current-only.**

### Reading the result list

| Column | Meaning |
|---|---|
| Sample type | **R** routine · **E** STAT · **C** control |
| **Host** | **Y** = sent to the LIS host, **N** = not |
| **Print** | **Y** = printed, **N** = not |

A sample shown in **yellow** has a test that triggered a **data alarm**.

Current results can be sorted by sample category, ID, status, position, completion time, program date/time, host, print and review status.

> For History, searching a large database is much faster if you supply **both the program date and another condition**.

### The function buttons

- **Search F1** — filter results
- **Options F2** — delete, edit, print, recall rerun results, customize display, recalculate, compensate, archive, result trend
- **Demog F3** — patient demographics
- **Reac Curve F4** — reaction curve and data
- **Rerun F5** — rerun a finished sample
- **Review F6** — mark reviewed
- **Print F7** — print results
- **Host F8** — transmit to the LIS host

### Reviewing

**Only samples in Complete status can be reviewed.** *By Sample* → select one or more → **Review F6**; the review status flips from **N** to **Y**. **No Review** undoes it.

### Reaction curve

Plots absorbance at the primary wavelength, secondary wavelength and primary-minus-secondary across the reaction period. Select a point to see its measuring period and absorbance.

> **Not available for ISE chemistry, off-system chemistry or special calculations.**

Filters: None, Chemistry, Sample. Buttons: **Reagent F1** (reagents used for analysis, calibration and reagent blank, with dates), **Sample Blank F2**, **Adjust F3**, **Prev/Next**, **Print F7**.

**Adjust F3** sets the absorbance display range — **Auto** derives it from the reaction data, **Manual** takes a range from **−40000 to 40000**. The adjustment applies only to the currently displayed curve and reverts next time it opens.

### Printing and transmitting

**Print by sample:** select samples (or none, for all) → **Print F7** → *Print Sample Report* → **Selected** or **All Sample(s)** → optionally tick **Bypass Printed Sample(s)** → **OK**. A report template must already be chosen in System Setup.

**Print by chemistry:** choose *By Chemistry* → select a chemistry (or none, for all) → **Print F7** → choose range → **OK**.

**Transmit to LIS:** *By Sample* → select samples (or none, for all) → **Host F8** → choose range → optionally tick **Bypass Transmitted Results** → **OK**. Works in any system status provided the LIS is connected.`,
      },
      {
        title: "Editing, Recalculating, Compensating and Archiving",
        body: `Four ways to change results after the fact. All are permission-gated and all are logged.

### Edit Results

For results that **slightly exceed the reference or linearity range but would not lead to misdiagnosis**, or that are uniformly high or low.

> **Caution:** Edit Results gives doctors freedom to modify results and must be used with caution. Only users with sufficient permissions may do it.

Rules:

- **Sample results only** — control results cannot be edited
- **Special calculations cannot** be edited; **off-system chemistries can**
- Only **analyzed samples with results** are editable
- For normal runs, only **Complete** chemistries can be edited
- For multi-run tests, each run's result can be edited — but for **reruns, only the default result** can be edited
- Edited results are **flagged**

*Result > Current* or *History* → search → select → **Options F2** → **Edit Results** → enter the value in the **Final Result** column → **Save** → **Exit**.

### Recalculate Results

Recalculates **current** sample results using the **latest valid calibration factors**. Its main use is when a result could not be calculated because calibration was incomplete or failed.

- **Biochemistries only**
- Samples in **In Progress** status cannot be recalculated
- Recorded automatically in the **event logs**

*Result > Current* → **Options F2** → **Recalculate** → choose the chemistry → **Calculate** → **Close**.

### Compensate Results

Recalculates **multiple results of one biochemistry** through the linear formula **Y = K·X + B**, with a slope K and offset B you supply.

- **Invalid** for ISE chemistry, special calculations and off-system chemistries
- A **calculation is recalculated automatically** once its constituent chemistries are compensated
- Permission-gated and logged

*Current* or *History* → **By Chemistry** → choose the chemistry → **Options F2** → **Compensate Results** → enter **K** and **B** → **Save** → **Exit**.

### Delete Results

> **Deleted results cannot be restored.** Archive them — to the LIS, to print, or to file — first.

- Storage is finite: when capacity is exceeded, **the earliest results are overwritten** automatically
- Routine, STAT and control results can all be deleted, including ones already sent to LIS or printed
- While the system is **Running**, samples in Running status cannot be deleted; in any other system status, samples in any status can
- Permission-gated and recorded in the **event logs**

*Options F2* → **Delete Results** → *Selected result(s)* or *All results* → **OK**.

### Archive Results

Exports to a storage device as **CSV**, named **SampleResultYYYYMMDD.csv** — the filename **cannot be edited**.

> **Note:** archiving a large volume takes a long time. **Do not archive more than one week at a time.**

*Options F2* → **Archive** → **OK**.

### Result trend

*Current* or *History* → **By Chemistry** → **Options F2** → **Recall Result Trend**. Hovering a point shows actual result, final result, completion time, reagent lot and serial number, and calibration time. Tick **Include Replicate Results** to show repeats and reruns.

### Statistics

**Test statistics** — *Result > Statistics > Tests*. **By Sample** shows requested samples and their chemistry counts; **By Test** shows test requisitions and reagent volume per chemistry. Set a date range (start no later than end) → **Search F1** → **Print**.

**Result statistics** — *Result > Statistics > Results*. Summarizes total chemistries and the **distribution trend** of their results, as **Statistic Graph** or **Statistic Data**.

> **Calibration and QC tests are excluded from both statistics.**`,
      },
    ],
    questions: [
      {
        prompt: "A sample runs out partway through its panel. What does the system do?",
        options: [
          "Automatically invalidates all incomplete chemistries for that sample",
          "Pauses the run and prompts you to top up the tube",
          "Completes the remaining chemistries using a reduced sample volume",
          "Flags the results but completes the panel normally",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which sample fields can NEVER be edited when setting up a rerun?",
        options: [
          "Sample ID, bar code, sample type and collection time",
          "Sample position, STAT flag and comment",
          "Sample volume, replicates and predilution factor",
          "Chemistries and panels",
        ],
        correct_index: 0,
      },
      {
        prompt: "For which chemistries is a sample blank effective?",
        options: [
          "Single-reagent endpoint chemistries only",
          "All biochemistries, including multi-reagent ones",
          "ISE chemistries only",
          "Kinetic and fixed-time chemistries only",
        ],
        correct_index: 0,
      },
      {
        prompt: "Auto release of sample positions is configured with a time. Which positions get released?",
        options: [
          "All patient sample positions in Complete status",
          "All positions on the carousel, including controls and calibrators",
          "All positions in Incomplete status",
          "Only positions that have been printed and transmitted to LIS",
        ],
        correct_index: 0,
      },
      {
        prompt: "A result falls below both the linearity low limit and the lowest calibrator concentration. With Optimize Result Display on, how is it shown?",
        options: [
          "< the maximum of the two values",
          "< the minimum of the two values",
          "< the linearity low limit",
          "As 0",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which operation is available on the Current results screen but NOT on History?",
        options: ["Recalculate", "Compensate Results", "Edit Results", "Archive"],
        correct_index: 0,
      },
      {
        prompt: "Compensate Results applies which formula?",
        options: [
          "Y = K·X + B, using a slope and offset you supply",
          "Y = X / K, using the calibration factor",
          "Y = K·X only, with no offset",
          "A logit-log 4P transformation",
        ],
        correct_index: 0,
      },
      {
        prompt: "How must a whole blood sample be prepared before loading?",
        options: [
          "Centrifuged at 2000 rpm for 5 minutes",
          "Diluted 1:10 with urine diluent",
          "Pretreated manually with wash solution",
          "Warmed to 37 °C for 5 minutes",
        ],
        correct_index: 0,
      },
      {
        prompt: "Reaction curves cannot be viewed for which tests?",
        options: [
          "ISE chemistry, off-system chemistry and special calculations",
          "STAT samples and controls",
          "Any sample recalled from the History screen",
          "Reruns and replicate results",
        ],
        correct_index: 0,
      },
      {
        prompt: "What is the recommended maximum amount of result data to archive in one operation?",
        options: [
          "One week",
          "One day",
          "One month",
          "There is no recommended limit",
        ],
        correct_index: 0,
      },
    ],
  },

  // ── Level 6 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 6 — Maintenance & Diagnostics",
    category: CATEGORY,
    pass_mark: 80,
    description:
      "Keeping the analyzer healthy: the diagnostic tests that isolate probe, level-sense and sensor faults, and the full scheduled maintenance programme from daily probe checks through six-month lamp replacement. Higher pass mark — skipped maintenance shows up as bad results weeks later.",
    lessons: [
      {
        title: "Diagnostics — What They Are and What They Are Not",
        body: `> Diagnostic tests are **made to detect failures, but cannot be used to confirm one specific failure.**

That sentence sets the correct expectation. A diagnostic narrows the field; **you** reach the conclusion by combining the diagnostic data with the warning messages and the observed failure characteristics.

All diagnostics live under *Utility > Maintenance > Diagnostics*, in three tabs:

| Module | Detects failures in |
|---|---|
| **Sample System** | Components of the sample system |
| **Reagent System** | Components of the reagent system |
| **Sensor Diagnosis** | The analyzer's sensors |

A recurring pattern across all of them: the test reports **PASS** or **FAIL** per item against a reference range, and the corrective action for almost every FAIL is **contact Customer Service or your local distributor**. The value of running the test is not that you will fix it yourself — it is that you can tell the engineer precisely which subsystem failed and with what values.`,
      },
      {
        title: "Sample System Diagnostics",
        body: `### Sample Probe Clog Detection

**Run it when you see any of these alarms:**

- Clog detection board communication error
- The sample probe is clogged while the sample is deemed OK
- The sample probe is clogged during cleaning
- Clog detection board working mode setting error

**Procedure:** *Diagnostics* → **Sample System** → **Sample Probe Clog Detection** → load **one sample tube of water into position 1** → **Next** → **Start**.

Five sub-tests run in order: **Basic Check**, **Wash Check**, **Clog Check**, **Sample Aspiration Check (1.5 µL)** and **Sample Aspiration Check (45 µL)**.

**Reference values:**

| Test item | Reference range |
|---|---|
| Clog detection board 12 V rail | **10.8–13.2 V** |
| Clog detection board 5 V rail | **4.5–5.5 V** |
| Clog detection board pressure | **9–17 psia** |
| Wash pressure | **≥ 30 psia** |

Everything else reports OK / Error. **PASS** in the PASS/FAIL column means normal.

### Sample Probe Level Sense Test

**Run it when the analysis has stopped and an alarm reports** that the sample probe contacted no liquid — in an aspiration position (sample carousel, reaction carousel, concentrated wash position), while dispensing into the reaction carousel, during ISE dispensing, during water testing, or in the wash well — **and you have already ruled out** probe clogging, reagent bubbles, reagent probe level sensing, ISE module faults and hydropneumatic failure.

That "already ruled out" clause matters: this test is a second-line diagnostic, not a first response.

**Procedure:** *Diagnostics* → **Sample System** → **Sample Probe Level Sense Test** → place a tube **two-thirds full of water** in the test position → **Next** → **Start**.

The default test position is **1**; change it with **Change Pos** to anything from **1 to 102**.

The system checks the level sense board voltage, then **detects level 20 consecutive times**.

**Interpreting the result:**

- **Level sense board voltage** — reference **2.8–4.8 V**. Outside that, call Customer Service.
- **Level sense test data** — the system compares the 20 lowering heights. If the probe reaches the **vertical extreme position**, or the **spread across the 20 heights exceeds 1 mm**, the result is abnormal.

An abnormal spread points at connections between the sample probe and the PCBA, PCBA power, level-sense output voltage, or the connection between the level sense board and the probe/mixer conversion board.`,
      },
      {
        title: "Reagent System and Sensor Diagnostics",
        body: `### Reagent Probe Level Sense Test

**Run it when the analysis has stopped and an alarm reports** that the reagent probe contacted no liquid on the reagent carousel, aspirated nothing at the aspiration position, contacted no liquid while dispensing reagent (**with reagent bubbles ruled out**), or contacted no liquid in the wash well (**with hydropneumatic failure ruled out**).

**Procedure:** *Diagnostics* → **Reagent System** → **Reagent Probe Level Sense Test** → place a bottle **two-thirds full of water** in position 1 of the reagent carousel → **Next** → **Start**.

Default position **1**, changeable from **1 to 92** — note the range differs from the sample carousel's 1–102, because the reagent carousel has 92 positions.

Interpretation is identical to the sample probe test: voltage reference **2.8–4.8 V**, and a spread of **more than 1 mm** across 20 lowering heights indicates abnormality.

### Sensor Diagnosis

**Run it when a mechanism loses steps or cannot find its mechanical zero position** — specifically:

- Reaction carousel loses steps or positioning fails
- Wash station loses steps or fails to find mechanical zero
- Sample or reagent carousel loses steps or positioning fails
- Sample or reagent probe loses steps horizontally or vertically, or fails to find mechanical zero
- Sample or reagent syringe loses steps or fails to find mechanical zero
- Sample mixer or reagent mixer fails to find mechanical zero
- Interior wash syringe fails to find mechanical zero
- Phase 1–2 wash syringe fails to find mechanical zero

**Procedure:** *Diagnostics* → **Sensor Diagnosis** → select the optical couplers (or **Select All** / **Cancel All**) → **Start** → **Stop** to end.

**Reading the result:** a high-level signal shows as **"unblocked"**, a low-level signal as **"blocked"**.

**The corrective action here is genuinely diagnostic and you can do it yourself:** physically block and unblock each sensor while the test runs.

- Displayed status **changes** with your action → the sensor works normally
- Displayed status **does not change** → the sensor is abnormal; contact Customer Service`,
      },
      {
        title: "The Maintenance Framework",
        body: `> **Warning:** do not perform any maintenance procedure not described in the manual, and do not touch components other than those specified. **Unauthorized maintenance can damage the instrument, cause personal injury, or invalidate the warranty.** After maintenance, verify that the system runs normally. Do not spill water or reagent on mechanical or electrical components.

If the system will be **stored for over 1 week or transported**, contact Customer Service for the necessary maintenance first.

### What the frequencies assume

All stated maintenance frequencies are based on **2 hours of work per day** — that is **2 × 420 = 840 tests/day**, and **2 × 420 × 25 = 21,000 tests/month**. A busier laboratory should scale accordingly.

### The three maintenance features

- **Biochemistry Maintenance** — frequently used commands for the biochemistry system
- **ISE Maintenance** — frequently used commands for the ISE module
- **Scheduled Maintenance Log** — what is due, when it was done, and who did it

Each maintenance command has an **online help icon** to its left showing the relevant instructions.

### The schedule periods

| Period | Interval |
|---|---|
| Daily | 1 day |
| Weekly | 8 days |
| Two-week | 15 days — **no items for this model** |
| Monthly | 31 days |
| Three-month | 91 days |
| Six-month | 181 days |
| Other | As-needed / as-required |

**The frequency counts down from the date performed.** At zero, the procedure highlights **yellow** — and so does the trail leading to it: the **Utility** button, the **Maintenance** tab, the **Maintenance** button, the **Scheduled Maintenance** tab, the **frequency** tab, and finally the procedure itself. Follow the yellow.

### Working the Scheduled Maintenance screen

**Property** shows **System** (manufacturer-defined, not configurable) or **User** (user-defined, configurable per frequency). **Operator** shows the currently logged-in user ID. **Date Performed** shows the confirmed date.

To record completion: tick the procedure's **Select** checkbox and choose **OK**. The date refreshes to today and **the countdown restarts from that date**.

| Button | Purpose |
|---|---|
| **OK** | Review the selected procedure and enter the date performed |
| **Log** | Record comments and other important information |
| **History** | Stored record of past performances with date and operator — **one procedure at a time**, editable and deletable, printable |
| **Select All** | Tick every procedure on screen |
| **Customize** | Define new procedures and assign procedures to frequencies |
| **Delete** | Remove a procedure — **user-defined only** |

**Customize** lets you create a procedure (**New** → name → **OK**), then move it between *Available Procedures* and *Enabled Procedures* with **>>** and **<<** for a chosen frequency. The maintenance schedule screen refreshes automatically.

> **Run calibration or quality control after performing maintenance.** Maintenance changes the instrument's state; QC is how you confirm the change was for the better.`,
      },
      {
        title: "Spare Parts, Consumables and Tools",
        body: `> Use only spare parts and consumables **manufactured or recommended by the manufacturer**. Others will not achieve the promised performance.

### Replacement intervals — worth memorising

| Part | Replace |
|---|---|
| **Lamp** | After **2000 hours or six months** |
| **Cuvette** | Every **three months** |
| **Filter core** | Every **three months** |
| **Inlet filter** | Every **six months** |
| **ISE pump tube** | Every **six months** |
| **Sample syringe** | After **100,000** uses |
| **Reagent syringe** | After **300,000** uses |
| **Sample probe** | When **damaged or bent** |
| **Reagent probe** | When **damaged or bent** |
| **ISE electrodes** | When needed |

Note the asymmetry between the syringes — the reagent syringe lasts **three times** as long as the sample syringe. That is why the subsystem **cycle count** display (Level 2) is useful: it tells you where each component sits against these numbers before it fails.

### Tools you must supply yourself

| Tool | Used for |
|---|---|
| Tube brush, ultrasound cleaner | Cleaning the filter core |
| Clean gauze | Syringes, rotors, probes, mixers |
| Cotton swabs | Wash wells, sample compartment |
| Suction cleaner | Fans and dust screens |
| Hair brush | Dust screen |
| Tweezers | Removing/installing probes and syringe washers |
| Beaker | Cleaning the needle and unclogging device |
| **Ethanol** | Photometer lens, probes, mixers, wash station |
| **NaClO — 0.5% sodium hypochlorite** | Wash wells |
| Fibre-free gloves | Replacing reaction cuvettes |
| Large water container | Cleaning the deionized water tank |
| Screen and keyboard wash solution | Screen and keyboard |

Two of these are easy to confuse and must not be swapped: **ethanol** cleans probes, mixers and the photometer lens; **0.5% NaClO** cleans wash wells. And recall from Level 1 — **never wipe the transparent upper cover with ethanol or organic solvents**.

> **Biohazard:** wear gloves and a lab coat throughout every maintenance procedure, and goggles where necessary.`,
      },
      {
        title: "Daily Maintenance",
        body: `Seven procedures, all before the day's analysis. The system status requirement varies — read it for each.

### 1. Check probes, mixers and wash wells — status: Standby

> **Warning:** the probes and mixers are **sharp and vulnerable**. Keep clear to avoid injury and collision damage.

*Utility > Maintenance > Maintenance > Biochemistry Maintenance* → **Clean Probes/Mixers/Wash Wells**.

1. Open the protective shield
2. Check probe and mixer exteriors for **stains and crystals** — if present, run *Clean Sample/Reagent Probe Exterior* or *Clean Mixers*
3. **Continue** to clean the probe interiors
4. **Check the liquid flow** — this is the diagnostic step:

| What you see | What it means | What to do |
|---|---|---|
| Flow sprayed out, or not vertical | Probe may be **clogged** | *Special Wash Probes* → recheck → *Clean Probe Interior* → recheck → *Replace Probe* or call service |
| Flow not continuous, or popping bubble sounds | **Air bubbles** in the tube | *Clean Probes Interior* to prime and discharge them |

5. **Second Wash** repeats the interior wash if needed
6. **Continue**, then observe the wash well water flow — it should reach **about 5 mm from the probe/mixer tip**. If not, call a service engineer
7. **Continue** → **Done** → restore the shield

### 2. Check sample and reagent syringes — status: Incubation or Standby

Materials: clean gauze.

Open the front door — the syringes sit either side of the water tank. **Wipe the plunger and connector with dry gauze**, then inspect the gauze. Moist gauze means a leak: **tighten the syringe**.

A leaking syringe cannot aspirate or dispense the correct volume, and may be damaged by continued use.

### 3. Check deionized water connection — status: powered off, Incubation or Standby

Confirm sufficient water in the tank, tubes **not bent, folded or leaking**, and the water supply module powered on.

### 4. Check waste and waste tank — status: powered off, Incubation or Standby

Confirm the waste tube is not bent or folded and both waste streams drain properly. **Empty the high-concentration waste tank** if it is not already empty.

Flow rates for reference: **high-concentration waste 1 L/H**, low-concentration waste **no more than 19 L/H**, water consumption **no more than 20 L/H**.

If leaks persist after these checks, contact Customer Service.

### 5. Check diluted wash solution — status: Incubation or Standby

> **Warning:** diluted wash solution is **corrosive to skin**. Gloves and goggles. On skin or clothes, wash off with soap and water; in the eyes, rinse and consult an ophthalmologist.

A full **15 L** tank lasts **8 days** with plastic cuvettes at 840 tests/day. Open the front door, check the volume, fill or replace.

### 6. Check probe wash solution — status: powered off, Incubation or Standby

Insufficient probe wash solution causes **probe clogging and cross contamination**.

The consumption arithmetic is worth knowing:

- **Sample probe** — three special washes after every batch, about **270 µL each**
- **Reagent probe** — about **600 µL per wash**
- **Prepare about 1.5 mL concentrated wash solution for the sample probe and 5 mL for the reagent probe daily**

Check positions **D2** (sample carousel) and **D** (reagent carousel), and fill or replace.

> **Caution:** while the system is running tests, **do not attempt to fill probe wash solution until the status becomes Standby.**

### 7. Clean electrode tubes — ISE module, status: both systems Standby

Takes about **2 minutes**. Removes proteins and lipids left on the electrode surfaces by high sample throughput.

**When:** after finishing all ISE tests of the day, before shutdown, **or every 50 samples**.

1. *Utility > Maintenance > Maintenance > ISE Maintenance* → **Clean Electrode Tubes**
2. Open the upper protective shield
3. Fill a 2 mL sample tube with **at least 300 µL of ISE wash solution** and load it to **position D1**
4. **Continue** → **Done**

> **Note:** **recalibrate the ISE electrodes** after this procedure, before starting analysis.`,
      },
      {
        title: "Weekly Maintenance",
        body: `Five procedures. Two of them — Cuvette Check and Photometer Check — must be run **in that order**, and the reason is worth understanding.

### 1. Clean sample/reagent probe exterior — status: not Running

Materials: 2 pieces of clean gauze, ethanol, deionized water, tweezers.

> **Warning:** the probe tip is sharp. If a probe is **bent or damaged, replace it immediately** — otherwise results will be unreliable.

1. **Switch off the analyzing unit power**
2. Rotate the probe arm to a convenient position and wipe the exterior gently with **ethanol-soaked gauze** until the tip is clear of stains. **Do not pull the probe horizontally** — you will damage it
3. Wipe off the ethanol with gauze moistened with **deionized water**
4. Switch the analyzing unit power back on
5. **Utility > Commands > Home** to reset the probe

### 2. Clean mixers — status: not Running

Identical procedure and materials, applied to the sample and reagent mixers. Same rule: do not pull horizontally; replace if bent or damaged; **Home** afterwards.

Both of these procedures exist to prevent **carryover between samples or reagents**.

### 3. Special wash — status: Standby

Takes about **30 minutes**. Cleans the sample probe, reagent probe, mixers, reaction cuvettes and wash station with concentrated wash solution, eliminating carryover and preventing waste from being left in the waste tubes.

**Also run this before storing the equipment for a long period.**

1. Open the upper protective shield
2. Place **more than 30 mL** concentrated wash solution in position **D of the reagent carousel**, and **more than 5 mL** in position **D2 of the sample carousel**
3. *Biochemistry Maintenance* → **Special Wash**
4. Tick **Perform Cuvette Check** if you want it to follow automatically — you should
5. **Continue** (or **Exit** to abort; **Stop** to terminate mid-run)
6. **Done**, restore the shield

### 4. Cuvette check — status: Standby, powered on over 10 minutes

Takes about **20 minutes**. Detects cuvettes whose light transmittance has fallen because of protein deposits, stains, scratches or damage.

**When:** weekly, **after a special wash**, or after replacing cuvettes. **Confirm every reaction carousel position has a cuvette** before starting.

*Biochemistry Maintenance* → **Cuvette Check** → confirm the lamp has been on **over 10 minutes** → **Continue** → **Start**.

**Results:** **no colour** = normal cuvette; **yellow** = dirty cuvette. **Record the yellow ones and replace them.**

**Result** opens the Cuvette Check Results window showing the latest check of **all 93 cuvettes at every wavelength**, navigable with **|<**, **<**, **>**, **>|** and printable.

> **Note:** when a cuvette is deemed dirty, **clean or replace it immediately and check again.**

### 5. Photometer check — status: Standby, powered on over 10 minutes

Measures the absorbance of **5 cuvettes** to detect light intensity that is too strong or too weak, telling you whether the lamp needs replacing.

**When:** weekly, or after replacing the lamp.

> **Note:** **perform the Cuvette Check first** and clean or replace any dirty cuvettes. Otherwise the photometer check results are **unreliable** — you would be measuring dirty glass, not a failing lamp.

*Biochemistry Maintenance* → **Photometer Check** → confirm lamp on over 10 minutes → **Continue** → **Start**.

The screen shows the **current** check's absorbance per wavelength on the left and the **previous** check's on the right — comparing them is how you see the lamp trending down over weeks.

**Acting on alarms:**

| Alarm | Action |
|---|---|
| **Lamp is off** | Check whether the lamp is on. If not, execute **Home**. If it is, contact Customer Service |
| **Light intensity too strong** | Contact Customer Service |
| **Light intensity weak** | **Replace the lamp** |`,
      },
      {
        title: "Monthly and Longer-Interval Maintenance",
        body: `### Monthly — seven procedures

1. **Clean wash wells** — status: not Running. Materials: cotton swabs and **0.5% NaClO**. Switch off the analyzing unit power, open the upper shield, rotate the sample probe, reagent probe and mixers **away from the wash wells**, clean each well with NaClO-moistened swabs, power back on, then **Utility > Commands > Home** and confirm normal water flow.
2. **Clean cuvette wash station and tubes** — prevents waste buildup and cross contamination.
3. **Clean filter core** — tube brush or ultrasound cleaner.
4. **Clean dust screens** — suction cleaner and hair brush.
5. **Clean sample injection port.**
6. **Pump calibration.**
7. **Air bubble detector calibration.**

### Three-month

1. **Clean DI water tank** — you will need a large water container.
2. **Replace filter core** — note the pattern: **cleaned** monthly, **replaced** every three months.

### Six-month

1. **Replace lamp** — or sooner, at **2000 hours**, or whenever the photometer check reports weak light intensity.
2. **Replace water supply filter** (inlet filter).
3. **Replace reference electrode.**
4. **Replace ISE pump tube.**

> Remember the Level 1 safety rule for the lamp: **switch off the MAIN POWER and wait at least 5 minutes** for it to cool before touching it.

### As-needed / as-required — twenty procedures

These are not on a countdown; you run them when circumstances call for them.

**Cleaning:** clean analyzer panels · bar code maintenance · clean sample compartment · clean reagent compartment · clean sample probe interior · clean reagent probe interior · **special wash probes** · clean waste tube of ISE module

**Replacement:** replace sample probe · replace reagent probe · replace sample mixer · replace reagent mixer · replace cuvettes · replace ISE electrodes · replace sample syringe · replace reagent syringe

**ISE-specific:** **store electrodes** · remove reagent pack

**Air bubbles:** remove air bubbles in sample syringe · remove air bubbles in reagent syringe

Two of these carry consequences you have already met in earlier levels:

- **Store electrodes** — required from Level 1 whenever an ISE-equipped system will be **powered off for a long time**, to stop the electrodes being damaged by water scarcity.
- **Replace ISE electrodes** — from Level 4, replacing an electrode forces the ISE chemistry into **Cal Required** status. Calibrate before testing.

### Using the log sheet

The manual provides a **Maintenance Log Sheet** with a column per day of the month for every procedure. **Copy it monthly and tick each procedure as you perform it.** Combined with the electronic **Log** and **History** buttons on the Scheduled Maintenance screen, that gives you both a paper and an electronic record of who did what and when — which is exactly what an auditor or a service engineer will ask for.`,
      },
    ],
    questions: [
      {
        prompt: "During the daily probe check the liquid flow sprays out sideways rather than falling vertically. What does this indicate and what is the first step?",
        options: [
          "The probe may be clogged — perform Special Wash Probes, then recheck",
          "There are air bubbles in the tube — perform Clean Probes Interior to prime",
          "The syringe is leaking — tighten the syringe",
          "The wash well is blocked — clean it with NaClO",
        ],
        correct_index: 0,
      },
      {
        prompt: "Why must the Cuvette Check be performed BEFORE the Photometer Check?",
        options: [
          "Dirty cuvettes make the photometer check results unreliable",
          "The photometer check consumes the cuvettes being tested",
          "The cuvette check warms the lamp to operating temperature",
          "The photometer check cannot run unless all 93 cuvettes pass",
        ],
        correct_index: 0,
      },
      {
        prompt: "After how many uses should the sample syringe and the reagent syringe be replaced?",
        options: [
          "Sample 100,000; reagent 300,000",
          "Sample 300,000; reagent 100,000",
          "Both after 100,000",
          "Both after 2000 hours",
        ],
        correct_index: 0,
      },
      {
        prompt: "In the Sample Probe Level Sense Test, what spread across the 20 lowering heights indicates an abnormal result?",
        options: [
          "Greater than 1 mm",
          "Greater than 5 mm",
          "Greater than 0.1 mm",
          "Any variation at all",
        ],
        correct_index: 0,
      },
      {
        prompt: "How often should the ISE electrode tubes be cleaned?",
        options: [
          "After all ISE tests of the day, before shutdown, or every 50 samples",
          "Weekly, alongside the mixer cleaning",
          "Every three months with the filter core",
          "Only when an ISE calibration fails",
        ],
        correct_index: 0,
      },
      {
        prompt: "In the Sensor Diagnosis test, you block a sensor and the displayed status does not change. What does this mean?",
        options: [
          "The sensor is abnormal — contact Customer Service",
          "The sensor works normally",
          "The optical coupler was not selected for the test",
          "The test must be restarted with Select All",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which cleaning agent is specified for the wash wells?",
        options: [
          "0.5% sodium hypochlorite (NaClO)",
          "Ethanol",
          "CD80 concentrated wash solution",
          "Deionized water only",
        ],
        correct_index: 0,
      },
      {
        prompt: "The maintenance frequencies in the manual are based on what daily workload?",
        options: [
          "2 hours a day — 840 tests/day, 21,000 tests/month",
          "8 hours a day — 3360 tests/day",
          "1 hour a day — 420 tests/day",
          "Continuous operation at 626 tests/hour",
        ],
        correct_index: 0,
      },
      {
        prompt: "What should be done immediately after performing any maintenance procedure?",
        options: [
          "Run calibration or quality control",
          "Archive all results to a USB drive",
          "Perform an emergency stop and then Home",
          "Replace the reaction cuvettes",
        ],
        correct_index: 0,
      },
      {
        prompt: "How much concentrated wash solution does the weekly Special Wash require, and where?",
        options: [
          "Over 30 mL in reagent carousel position D, and over 5 mL in sample carousel position D2",
          "Over 5 mL in reagent carousel position D, and over 30 mL in sample carousel position D2",
          "15 L in the diluted wash solution tank only",
          "300 µL in sample carousel position D1",
        ],
        correct_index: 0,
      },
    ],
  },

  // ── Level 7 ────────────────────────────────────────────────────────────────
  {
    title: "BS-430 Level 7 — Troubleshooting & Operation Theory",
    category: CATEGORY,
    pass_mark: 80,
    description:
      "The final level. Reading error codes and logs, interpreting every data alarm flag and acting on it, and then the measurement theory underneath it all — endpoint, fixed-time and kinetic methods, calibration math models, prozone checking and ISE measurement.",
    lessons: [
      {
        title: "Logs and Error Codes",
        body: `### Two kinds of log

**Error logs** record failures across all system components. **Edit logs** record deletions and some edits — specifically all deletions other than error deletion, plus edits to **sample results and calibration factors**.

### Reading an error code

An error code is **6 characters**: a letter, two digits, three digits.

**\`C01001\`** decomposes as:

- **C** — the error occurred on the **operation unit**
- **01** — the component: **system communication**
- **001** — serial number of that error

So \`C01001\` is *the first instrument-connection error on the operation unit*.

**Prefix A** means the error occurred on the **analyzing unit**.

**Operation unit (C) component codes:** 00 operating system · 01 system communication · 02 database · 03 result calculation · 04 sample bar code · 05 reagent bar code · 06 LIS host communication · 07 other

**Analyzing unit (A) component codes:** 00 command execution · 01 sample probe unit · 02 probe R1 unit · 03 reagent probe unit · 04 sample mixer · 05 reagent mixer · 06 reaction carousel · 07 sample carousel (incl. sample bar code module) · 09 reagent carousel (incl. reagent bar code module) · 11 wash unit · 12 temperature unit · 14 reagent refrigeration unit · 15 other · 21 probe interior wash unit · 22 home process or ISE unit

**Every error log has an online help icon** in front of it giving the description, probable causes and solutions. Use it before anything else.

### Working the log screens

Reach the Error Log via the **Alarm** button; it defaults to today's errors. Each entry holds **event ID, date/time, error description, event class and symptom**.

Each edit log entry holds **serial number, date/time, operator, event type and description**.

| Button | Error log | Edit log |
|---|---|---|
| **Search F1** | by date, event ID, symptom, event class | **by date only** |
| **Refresh F2** | ✓ | ✓ |
| **Delete F3** | ✓ (permission-gated) | ✓ (permission-gated) |
| **Print F7** | ✓ | ✓ |

**Logs can be recalled by any user in any system status** — but only users with sufficient permission can delete them.

On refresh, new error logs appear chronologically and colour-coded: **yellow = warning, red = serious error**. New edit logs appear at the front of the list.

> Storage is limited — **clear and manage logs regularly** so the most recent and important ones are retained.

> Printing logs **takes a long time and a great deal of paper. Think twice.** To stop it: *Utility > Commands > Stop Print*.`,
      },
      {
        title: "How Errors Announce Themselves",
        body: `Troubleshooting always follows the same five steps:

1. An error occurs and is indicated
2. Check the error logs and component status
3. Identify the error and determine solutions
4. Implement the solutions
5. **Check and evaluate the implementation**

That last step is the one people skip.

### Six indication channels

**Alarm tone** — the buzzer sounds. Adjustable at *Utility > System Setup* via the **Alarm Volume** slider; drag fully left to silence it.

**Alarm message** — appears in the **second line** of the prompt message area.

**Colour highlight** — yellow for a warning, red for a serious warning or error, on the **Reagent**, **Utility** and **Alarm** buttons. Select the highlighted button to reach the relevant page. **The indication disappears when the problem is solved**, which makes it a useful confirmation that your fix worked.

**Alarm message box** — contains date/time, event ID, occurrence count and a help icon. Two severities:

| Type | Title bar | What you can do |
|---|---|---|
| **Common error** | **Yellow** — warns the user, or invalidates tests, reagents and samples | Continue working |
| **Serious error** | **Red** — everything else | **Only reboot or exit the system** |

**Flag (data alarm)** — appears beside a calibration or sample result when the sample, reagent or system caused an error.

**Error log** — everything is recorded here.

### Two error types

| Type | Identified by |
|---|---|
| **Instrument failure and error** | The **event ID**, looked up in the Error messages and corrective actions table |
| **Data alarm** | The **flag symbol**, looked up in the Result flags table |

> A data alarm **is not necessarily an error**, but it will **definitely influence the result** and must be considered carefully.`,
      },
      {
        title: "Data Alarms — Range, QC and Calibration Flags",
        body: `### Range flags

| Flag | Meaning | Action |
|---|---|---|
| **<** | Below linearity range low (or ISE measurement range low) | None, or rerun to confirm |
| **>** | Above linearity range high (or ISE measurement range high) | **Rerun with sample diluted or decreased** |
| **^** / **v** | Above / below the **reference** range | None required |
| **^!** / **v!** | Above / below the **critical** range | None required |
| **▲** / **▼** | Sample volume increased / decreased | None required |
| **R** | Rerun result | None required |
| **LOW** | Response below the lowest-concentration calibrator — sample below the reagent's stated sensitivity | **Ascending** curve: rerun with standard or increased volume. **Descending** curve: rerun diluted |
| **RRN** | Response above the highest-concentration calibrator | Rerun diluted |

Note the asymmetry between **<** and **>**: a low result usually needs no action, a high one usually needs dilution.

### QC flags

| Flag | Condition |
|---|---|
| **1-2s** | Current QC result between ±2 and ±3 SD from the assigned mean — **no action required** |
| **1-3s** | Current QC result beyond ±3 SD |
| **2-2s** | Two controls in one run, or two consecutive results of one control, on the same side and beyond ±2 SD |
| **R4S** | One result in a run above +2 SD and another below −2 SD |
| **4-1s** | Two runs (4 results), or 4 consecutive results, same side and beyond ±1 SD |
| **10-x** | Five runs (10 results), or 10 consecutive results, all on the same side |

**1-2s is a warning only.** For every other QC flag the action is the same: **check that the reagent is qualified, the control sample is normal, and the instrument is working correctly.**

### Calibration and audit-trail flags

**No action required** — these simply record what was done: **CALE** (edited factors) · **CALJ** (rejected factors) · **CALR** (recalculated factors) · **EXT** (extended calibration) · **OVE** (overridden calibration) · **EDT** (edited result) · **REC** (recalculated result) · **REE** (compensated result) · **SLP** (result corrected by slope/offset) · **DEL** (deleted QC result)

**Action required:**

| Flag | Meaning | Action |
|---|---|---|
| **CALF** | Calibration failed | Recalibrate |
| **COV** | Calibration curve not convergent (nonlinear) | Check reagent and calibrator, recalibrate. If it persists, call Customer Service |
| **MON** | Calibration curve not monotonic | Check the calibrator is **defined and placed correctly**, recalibrate |
| **CSD** | Curve standard deviation out of range | Check the acceptance limit is reasonable and reagent/calibrator normal, recalibrate |
| **DET** | Determination coefficient out of range | As CSD |
| **DUP** | Repeatability error — max minus min calibrator response beyond limit | As CSD |
| **FAC** | Slope difference between two adjacent calibrations beyond limit (**linear only**) | As CSD |
| **SEN** | Sensitivity error — response difference between max and min calibrators beyond limit | As CSD |
| **ICA** | Response normal but result uncalculable — **chemistry not calibrated** | Calibrate, then rerun |`,
      },
      {
        title: "Data Alarms — Reaction, Reagent and ISE Flags",
        body: `### Reaction and optical flags

| Flag | Meaning | Probable cause and action |
|---|---|---|
| **ABS** | Absorbance out of range — primary or secondary wavelength above **3.4 A** | Check the sample for foreign matter or interferents; check the reagent is qualified and correctly positioned; check the cuvette is clean; check the photometric system |
| **BLK** | Blank response out of range | Bad reagent, insufficient reagent dispensed, air bubbles in the cuvette, light drift, or cuvette overflow. Check all of these, then replace the reagent and rerun |
| **MBK** | Mixed blank absorbance out of range | Bad reagent, unclear or overflowed cuvette, insufficient reagent. Same checks, then replace reagent and rerun |
| **RBK** | R1 blank absorbance out of range | As MBK |
| **BOE** | **Substrate depletion** during fixed-time measurement — sample concentration too high | Check the reaction curve and substrate depletion limit. **Rerun diluted** |
| **LIN** | **Non-linear** — measuring points not linear | Sample too concentrated, or the substrate depletion limit is unset/unreasonable, or **the lamp is aged**. Rerun diluted. **If it affects more than one chemistry and the reaction curve fluctuates irregularly, replace the lamp** |
| **NLN** | **No linear interval** — fewer than 3 valid measuring points within reaction time | Rerun diluted |
| **ENC** | **No calculation interval** — substrate depleted within the lag time | Check the reaction curve and depletion limit. Rerun diluted |
| **EXP** | Enzyme linearity range extended — result calculated from lag-time points | Rerun diluted |
| **PRO** | **Prozone check error** — antibody excess from too-high concentration | Check the reaction curve and prozone parameters. Rerun diluted |
| **RCE** | Response calculation error — incomplete absorbance data, or dividend is 0 | Rerun. If it persists, call Customer Service |
| **CALCE** | Special calculation chemistries exceed the linear range | Check for clots and probe clogging, check reagent expiry, rerun — or run HbA1c with manual pretreatment |

**L!** — water blank fluctuation out of range. Eight possible causes, worked through in order: cuvette overflowing · **the Replace Lamp command was not executed during lamp replacement** · cuvette check not performed after maintenance · loose cable connectors · loose retaining screw · **cleaning liquid inside the cuvette less than half full** · aged lamp · photometer fault.

**T1** — reaction disk temperature error. Ambient temperature out of range, faulty temperature sensor, protection switch, heater or PCB, lost parameters, or electromagnetic interference. **Check whether the error is accidental; if not, contact Customer Service.**

### Sample and reagent flags

| Flag | Meaning | Action |
|---|---|---|
| **SMPL** | Insufficient sample | Refill the sample |
| **SMPE** | Expired sample | Replace the sample |
| **SMPA** | **Air in sample** (ISE) | Increase sample volume — **at least 90 µL must be prepared**; reinstall the electrode; check and if necessary replace the waste tube |
| **SJAM** | **Sample probe clogged** during sampling | Sample treatment |
| **RGTL** | Insufficient reagent | Replace the reagent |
| **RGTE** | Expired reagent | Replace the reagent |
| **DTGL** | Insufficient probe wash solution during measurement | Fill more probe wash solution |

### ISE electrode and fluidics flags

**PUGA / PUGB — air in calibrator A or B.** Causes run from simplest to most involved: calibrator exhausted · bubbles in the calibrator tube · pump tube A aging, blocked or broken · waste pump tube aging, blocked or broken · sample injection port or fluidic path blocked or leaking · air bubble detector failed. Work the list in order: replace the reagent pack → **purge B** to remove bubbles → replace the pump tube → clean the injection port and reinstall the electrodes → replace the bubble detector.

**CALF (ISE) — no fluid in tubing** and **CALM — air in segment** share the same three causes: aging/blocked/broken waste pump tube, blocked or leaking sample injection port and fluidic path, or a failed air bubble detector. Same remedial sequence.

**NOIS — electrode voltage noise.** Electrode failure → replace the electrode. Environmental interference → **relocate the instrument**. ISE main control board failure → replace it. **Salt buildup around electrodes or tubes from fluidic leaks** → clean the tubes and electrodes.

**VDRF (voltage drift), VOUT (voltage overflow) and SLDR (slope drift)** share a diagnostic ladder worth memorising:

1. Electrode or reagent pack fails → replace the faulty part
2. **Electrode unsteady — a new electrode becomes steady 15 minutes after installation.** Wait
3. **New reagent pack unsteady — run a couple of calibrations** after installing it
4. **Reference electrode used for over 66 months** → replace it
5. ISE main control board failure → replace it
6. **Ambient temperature fluctuating drastically** → control it to within **±4 °C**

Points 2 and 3 are the important ones: two of the six causes are simply *impatience*. A fresh electrode or reagent pack needs settling time before it will calibrate cleanly.

**SLEX — slope out of range.** Electrode installed incorrectly → reinstall. Calibrator expired → replace. Electrode degenerated → replace and rerun. **Bubbles in the reference electrode → remove the electrode, clap on it to dislodge the bubbles, reinstall and calibrate.** Reference electrode used a long time → replace. Electrodes interfered → **troubleshoot by swapping them in different groups**. **Module or tubing temperature above 32 °C** → monitor and relocate if necessary.

**DEP (saving calibration result error) and RESP (response check code error)** point at communication, not chemistry: ISE communication cable → replace. Communication interface or pins → replace. ISE main control board → replace. Software error → **upgrade or reinstall the operating software**.`,
      },
      {
        title: "Measurement Theory — The Signal Chain",
        body: `The BS-430 is a fully automated, computer-controlled clinical chemistry analyzer allowing **random selection of chemistries**.

### From light to result

**AD value → Absorbance → Response → Calibration factors → QC result → QC conclusion → Sample result**

The system measures light intensity through **photoelectric conversion, linear amplification and AD conversion**, then calculates the reaction mixture's absorbance and absorbance change rate — the **response**. From calibrator responses it derives the **calibration factors**. Control results then evaluate system performance; if the system is behaving, patient sample results are calculated using those same factors.

Every flag in the previous two lessons attaches to some point in that chain. That is why they are diagnostic: the flag tells you *where* the chain broke.

### Notation used throughout

- **N and P** — the blank read time range
- **L and M** — the reaction read time range
- **Absorbance A** — in **double-wavelength** measurement, the **difference** between primary and secondary wavelength absorbance; in **single-wavelength** measurement, simply the primary wavelength absorbance

### The four K factors

The calculation factor **k** varies with the dispensed volumes:

- **k₁ = (V_R1 + V_S) / V_R1**
- **k₂ = (V_R1 + V_S + V_R2) / (V_R1 + V_R2)**
- **k₃, k₄** extend the same pattern for triple and quadruple reagent chemistries

Where V_R1…V_R4 are the reagent volumes and **V_S is the actual sample volume dispensed for reaction**. These are dilution corrections — the more liquid in the cuvette, the more the true concentration is diluted, and k compensates.

**When the blank absorbance is not subtracted (N = P = 0), K = 0.** When the blank is read **after** the reaction begins, **K = 1**.`,
      },
      {
        title: "Endpoint, Fixed-time and Kinetic Measurements",
        body: `### Endpoint — the equilibrium method

The reaction reaches equilibrium; because the equilibrium constant is high, effectively **all substrate has become product** and the absorbance stops changing. **Absorbance change is directly proportional to analyte concentration.**

> Endpoint is described as **the most ideal method for measurement** — it is **insensitive to minor changes** in enzyme volume, pH and temperature, provided those changes are not large enough to affect the reaction time.

**How the reaction absorbance is calculated depends on how many measuring points you gave it:**

| Reaction time range | Points used | Absorbance A_i |
|---|---|---|
| **L = M** | 1 | The absorbance at point M |
| **L = M − 1** | 2 | The **average** of the two |
| **L = M − 2** | 3 | The **median** — max and min discarded |
| **M > L + 2** | 4+ | The **average of the remainder** after discarding max and min |

Blank absorbance A_b is calculated the same way. **When N = P = 0, A_b is not calculated at all.**

**Response: R = k · (A_i − A_b)**

**Sample blank:** the sample blank reaction curve is **almost a straight line with slope 0**, which is why it means nothing for fixed-time and kinetic analysis and is only used in **single-reagent endpoint** measurement. The sample-blanked response is **R′ = R − R_sb**.

### Fixed-time — the rate method

Also called **rate reaction, first-order kinetic reaction, or two-point kinetic reaction**.

Reaction velocity is proportional to substrate concentration: **v = k[S]**. As substrate is consumed, velocity — and the absorbance change rate — falls.

Substrate concentration at time t: **[S] = [S₀]·e^(−kt)**

The change over a fixed interval t₁ to t₂ is therefore **proportional to the initial concentration [S₀]** — that is the defining feature of all rate measurements. Within that interval, absorbance change is directly proportional to analyte concentration.

> Theoretically the reading could be taken at any time. In practice **the reaction only becomes steady after a lag**, because it is complicated at the beginning and serum composition produces miscellaneous side reactions.

Available in **single-interval and double-interval** forms. In the double-interval form, the **sample blank — the absorbance change at two points within the incubation time — is subtracted** from the reaction absorbance.

Fixed-time allows **substrate depletion checking at the two measuring points**; on detection the result is flagged **BOE**.

### Kinetic — zero-order, continuous monitoring

Reaction velocity is **independent of substrate concentration** and constant throughout. Absorbance changes evenly, and the change rate **ΔA/min is directly proportional to analyte activity or concentration**. **Chiefly used for enzyme activity.**

> The honest caveat from the manual: substrate concentration cannot be *absolutely* high, so once substrate is consumed to some degree **the reaction is no longer zero-order**. The reaction type only holds within a certain reaction period.

**Three-step calculation:** determine the linearity range → calculate the response by the **least squares method** → evaluate linearity.

**Determining the linearity range** — the absorbance linearity range is set by the substrate depletion limit and checked **within the reaction time, not the blank time**. Let N be the number of measuring points within that limit:

| N | Behaviour |
|---|---|
| **N ≥ 3** | Linearity range spans all points from reaction start to the depletion limit |
| **N = 2** | Response calculated from **two** points, flagged **NLN** |
| **N = 0 or 1** | Flagged **NLN** either way. If **Enzyme Linear Extension** is enabled, extension kicks in |

**Response: R = K · (ΔA_LM′ − ΔA_NP)**, where ΔA_NP is 0 when N = P = 0.

**Evaluating linearity** — the system compares the absorbance change rate in the **front** part, the **back** part and **overall**:

| Points in range | Front / back sample |
|---|---|
| **N > 8** | First 6 and last 6 points |
| **4 ≤ N ≤ 8** | First 3 and last 3 points |
| **N ≤ 3** | **Linearity is not checked** |

Linearity is also **not checked** when the change rates are below **60 (A/10000/minute)**. Exceeding the configured linearity limit produces the **LIN** flag.

### Enzyme linearity range extension

In **high-activity enzyme measurement** the substrate depletes quickly and the reaction curve is obviously non-linear. Normally that yields **NLN** and a request to rerun diluted — inconvenient.

Extension instead looks **backwards into the lag time**. If the reaction start is t₁ and the reaction window is t_L–t_M, then **t₁–t_L is the lag time**. When fewer than 2 valid points exist in t_L–t_M, the system finds a depletion-free sub-range t₁–t_L′ inside the lag time and computes **ΔA = 60·(A_i+1 − A_i)/(t_i+1 − t_i)** across it, taking the **maximum ΔA** as the sample response.

If even that yields fewer than 2 valid points, no response is calculated and the result is flagged **ENC**. Successful extension flags the result **EXP** and **NLN**.`,
      },
      {
        title: "Calibration Math Models, Prozone and ISE Theory",
        body: `### Linear models — for colorimetry

All three share the form **C = K · (R − R₀)**.

- **Single-point (K factor)** — K is user-defined; **R₀ is the reagent blank response of the first calibrator**, or **0** if the chemistry is not reagent-blanked.
- **Two-point** — requires 2 calibrators. **K = (C₂ − C₁)/(R₂ − R₁)**, and R₀ = R₁ − C₁/K.
- **Multi-point** — requires **n ≥ 3** calibrators; K and R₀ derived by **least squares**.

### Non-linear models — for turbidity

| Model | Calibrators | Factors | Fitted by | Applies to |
|---|---|---|---|---|
| **Logit-Log 3P** | 3–10 | R₀, K, a | L-M method | — |
| **Logit-Log 4P** | ≥ 4 | R₀, K, a, b | L-M method | Response **inversely** proportional to concentration |
| **Logit-Log 5P** | ≥ 5 | R₀, K, a, b, c | L-M method | As 4P, with **higher fitting** |
| **Exponential 5P** | ≥ 5 | R₀, K, a, b, c | L-M method | Response **directly** proportional to concentration |
| **Polynomial 5P** | ≥ 5 | R₀, a, b, c, d | Least squares | R₀ is the response of the first calibrator (internal concentration 0) |
| **Parabola** | ≥ 3 | a, b, R₀ | Least squares | R = aC² + bC + R₀ |
| **Spline** | 3–10 | **4(n−1)** factors | Subsection fitting | **Best-fit curves of any model** |
| **Line** | 2–10 | **2(n−1)** factors | — | — |

Two things to carry away: **Spline gives the best fit** because it fits piecewise rather than globally, and **Logit-Log 4P versus Exponential 5P is chosen by the direction of the curve** — inverse versus direct proportionality.

### Prozone check

In antigen–antibody reaction, the amount of insoluble compound depends on their **proportion**. Maximum compound forms at the correct proportion — least light passes, greatest absorbance. Away from that point the curve has a **prozone (antibody excess)** side and a **postzone (antigen excess)** side, with the **equivalent zone** between.

The danger is that a very high concentration can produce the **same** low response as a low concentration. Prozone checking distinguishes them.

**Antigen addition method** — detects antigen excess by adding more antigen. If antibody is still in excess, the reaction **increases**; if antigen was already excessive, the reaction **decreases**. Works for single- and double-reagent chemistries.

Parameters **PC_M, q1, q2** — with **53 ≤ q2 ≤ 86** and **reaction end point ≤ q1 ≤ 52**. If any of PC_M, q1 or q2 is left blank, **no antigen check is performed**.

**PC = A_q2 − k·A_q1**, where for single-reagent chemistries k = (V_R1 + V_S)/(V_R1 + 2V_S), and for double-reagent chemistries k = (V_R1 + V_S + V_R2)/(V_R1 + 2V_S + V_R2).

Flagged **PRO** when **PC < PC_M in positive reactions**, or **PC > PC_M in negative reactions**.

**Reaction rate method** — rests on the fact that **the antibody-excess reaction, but not the antigen-excess reaction, reaches equilibrium within the same period**.

Parameters **PC_M, q1, q2, q3, q4** plus the absorbance low limit **ABS**, with

**PC = (A_q4 − A_q3) / (A_q2 − A_q1)**

Flagged **PRO** when **PC > PC_M**. Measuring point ranges follow the familiar reagent-count pattern: single 7 ≤ q1 < q2 < q3 < q4 ≤ 39, double from 23, triple from 53, quadruple from 69.

**Prozone check is disabled when** the reaction end-point absorbance minus start-point absorbance is **less than ABS**, or when the sample response falls outside the calibrator response range for non-linear chemistries.

### ISE measurement

The ISE unit measures **Na⁺, K⁺ and Cl⁻** in serum and urine by the **ion-selective electrode method**. The relationship between the electrodes' **electromotive force and ion concentration** is expressed by the **Nernst formula**.

**Serum is tested undiluted. Urine must be diluted manually with buffer solution at 1:9** before testing.

A single ISE measurement runs in four steps:

1. **Drainage** — the calibrator in the ISE pipe is drained
2. **Sample analysis** — the sample probe dispenses **70 µL serum** or **140 µL diluted urine** into the sample injection port; the sample is drawn into the flow cell, measured, and the waste drained
3. **Cleaning pipework** — **100 µL of calibrator A** cleans the ISE flow cell
4. **Single-point calibration** — **80 µL of calibrator** performs a single-point calibration

That last step is worth noting: **every ISE measurement ends with a fresh single-point calibration**, which is why ISE calibration status is so sensitive to electrode and reagent changes.`,
      },
    ],
    questions: [
      {
        prompt: "The error code A03017 tells you the failure occurred where?",
        options: [
          "On the analyzing unit, in the reagent probe unit",
          "On the operation unit, in the result calculation module",
          "On the analyzing unit, in the reaction carousel unit",
          "On the operation unit, in the LIS host communication module",
        ],
        correct_index: 0,
      },
      {
        prompt: "An alarm message box appears with a RED title bar. What are your options?",
        options: [
          "Only reboot or exit the system",
          "Acknowledge it and continue working normally",
          "Silence the buzzer and resume the run",
          "Run the Home command and continue",
        ],
        correct_index: 0,
      },
      {
        prompt: "Which QC flag requires NO action?",
        options: ["1-2s", "1-3s", "2-2s", "R4S"],
        correct_index: 0,
      },
      {
        prompt: "The LIN flag appears on more than one chemistry and the reaction curves fluctuate irregularly. What does this point to?",
        options: [
          "An aged lamp — replace it",
          "Samples that are all too concentrated — dilute and rerun",
          "An unset substrate depletion limit on each chemistry",
          "A clogged sample probe",
        ],
        correct_index: 0,
      },
      {
        prompt: "An ISE electrode has just been installed and calibration reports voltage drift. What is the manual's first suggestion?",
        options: [
          "Wait — a new electrode becomes steady 15 minutes after installation",
          "Replace the reference electrode immediately",
          "Replace the ISE main control board",
          "Relocate the instrument away from interference",
        ],
        correct_index: 0,
      },
      {
        prompt: "In endpoint measurement with a reaction time range of L = M − 2 (three measuring points), how is the reaction absorbance calculated?",
        options: [
          "The median — the maximum and minimum are discarded",
          "The average of all three points",
          "The absorbance at point M only",
          "The average of the first and last points",
        ],
        correct_index: 0,
      },
      {
        prompt: "In kinetic measurement, how many measuring points must fall within the substrate depletion limit for the full linearity range to be used?",
        options: ["3 or more", "Exactly 2", "1 or more", "5 or more"],
        correct_index: 0,
      },
      {
        prompt: "Which calibration math model gives the best-fitting curve, and why?",
        options: [
          "Spline — it uses subsection (piecewise) fitting",
          "Logit-Log 5P — it uses five factors",
          "Polynomial 5P — it fits a cubic expression",
          "Multi-point linear — it uses least squares across all calibrators",
        ],
        correct_index: 0,
      },
      {
        prompt: "How must a urine sample be prepared for ISE measurement?",
        options: [
          "Diluted manually with buffer solution at 1:9",
          "Tested undiluted, like serum",
          "Diluted 1:10 with physiological saline",
          "Centrifuged at 2000 rpm for 5 minutes",
        ],
        correct_index: 0,
      },
      {
        prompt: "Why does the prozone check exist?",
        options: [
          "A very high concentration can produce the same low response as a low concentration",
          "It detects substrate depletion in kinetic reactions",
          "It corrects for hemolysis, icterus and lipemia in the sample",
          "It compensates the result using slope and offset factors",
        ],
        correct_index: 0,
      },
    ],
  },
];

module.exports = { LEVELS, CATEGORY };
