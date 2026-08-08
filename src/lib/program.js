/* ============================================================
   FIGHT CAMP — the program.

   This file encodes an evidence-based protocol Ryan approved.
   Do not "improve" the exercises, schemes, week plan or warm-ups.
   Palette: mat-room dark + gi-gold accent.
   ============================================================ */

export const C = {
  ink: "#0D1117",
  panel: "#161C26",
  panel2: "#1C2431",
  line: "#2A3342",
  gold: "#E0A83C",
  goldDim: "#8A6A28",
  green: "#5BBF7A",
  red: "#E2634F",
  blue: "#5B9BD5",
  text: "#EAE6DB",
  dim: "#8B94A3",
};

export const PROGRAM = {
  A: {
    name: "Session A — Upper Pull",
    day: "Tue",
    color: C.gold,
    warmup: [
      "Row / skip / bike — 3–4 min easy, until lightly sweating",
      "Band pull-aparts × 15",
      "Scapular pull-ups (hang, shrug shoulder blades) × 8",
      "Arm circles + thoracic rotations × 10 each way",
      "Wrist rolls + forearm squeezes × 20",
      "Easy dead hang 20–30s (this doubles as your hang test on test days)",
      "Ramp-up: bodyweight pull-ups × 5, then +50% of working load × 3",
    ],
    exercises: [
      { name: "Weighted Pull-up", scheme: "4–5 × 3–5 @ RPE 7–8", range: [3, 5], weighted: true },
      { name: "KB / Chest-supported Row", scheme: "3 × 6–8", range: [6, 8], weighted: true },
      { name: "Turkish Get-up", scheme: "3/side, slow", range: [3, 3], weighted: true },
      { name: "Hanging Leg Raise", scheme: "3 × 8–12", range: [8, 12], weighted: false },
      { name: "Bar Hang / Farmer Hold", scheme: "2 × max time (s)", range: [30, 90], weighted: false },
    ],
  },
  B: {
    name: "Session B — Lower (Knee)",
    day: "Mon",
    color: C.blue,
    warmup: [
      "Bike — 3–5 min easy spin (knee-friendly blood flow)",
      "Leg swings front-back + side-to-side × 10/side",
      "Hip CARs (slow controlled circles) × 5/side",
      "Ankle rocks / knee-over-toe drift × 10/side",
      "Glute bridges × 10, slow squeeze at top",
      "Bodyweight squats to comfortable depth × 10",
      "Then the Spanish Squat ISO primer — log it as exercise 1 below",
      "Ramp-up: bodyweight Bulgarian split squats × 6/side",
    ],
    exercises: [
      { name: "Spanish Squat ISO (primer)", scheme: "5 × 45s hold", range: [45, 45], weighted: false },
      { name: "Bulgarian Split Squat", scheme: "3 × 6–8/leg @ RPE 7", range: [6, 8], weighted: true },
      { name: "Leg Extension (terminal)", scheme: "3 × 8–12 slow", range: [8, 12], weighted: true },
      { name: "Box / Goblet Squat", scheme: "3 × 5", range: [5, 5], weighted: true },
      { name: "RDL / KB Swing", scheme: "3 × 6–8 / 5×10", range: [6, 10], weighted: true },
      { name: "Tibialis Raise", scheme: "2–3 × 15–20", range: [15, 20], weighted: false },
    ],
  },
  C: {
    name: "Session C — Upper Push",
    day: "Thu",
    color: C.green,
    warmup: [
      "Row / skip — 3–4 min easy",
      "Band external rotations × 15/side (slow, elbow pinned)",
      "Face-pulls × 15, pause at the back",
      "Scapular push-ups × 10",
      "Wall slides / controlled overhead reaches × 10",
      "Dip support hold 15s + shallow bodyweight dips × 5 (grease the exact groove)",
      "Ramp-up: bodyweight dips × 5, then bar-only or 50% press × 5",
    ],
    exercises: [
      { name: "Dip (shoulder-safe)", scheme: "4 × 4–6 @ RPE 7", range: [4, 6], weighted: true },
      { name: "Overhead / Z-Press", scheme: "3–5 × 3–5 @ ~80%", range: [3, 5], weighted: true },
      { name: "Weighted Push-up", scheme: "3 × 6–10", range: [6, 10], weighted: true },
      { name: "Hanging Leg Raise", scheme: "3 × 8–12", range: [8, 12], weighted: false },
      { name: "Face-pull / Pull-apart", scheme: "2 × 20", range: [20, 20], weighted: true },
    ],
  },
  MOB: {
    name: "Mobility Day (Niggle Swap)",
    day: "Any — swap for a lift when niggly",
    color: "#4EC5C1",
    warmup: [
      "2–3 min easy cardio or brisk walk",
      "Joint circles head to ankle — 30s total, nothing forced",
    ],
    exercises: [
      { name: "Spanish Squat ISO", scheme: "5 × 45s @ ~70% effort", range: [45, 45], weighted: false },
      { name: "Prying Goblet Squat", scheme: "2 × 60s (light KB)", range: [60, 60], weighted: true },
      { name: "Cossack Squat", scheme: "2 × 6/side, knee-tolerant depth", range: [6, 6], weighted: false },
      { name: "Hip Flexor PNF (couch stretch)", scheme: "2 × 60s/side, contract-relax", range: [60, 60], weighted: false },
      { name: "Hamstring PNF", scheme: "2 × contract-relax/side", range: [60, 60], weighted: false },
      { name: "Thoracic Opener / Rotations", scheme: "2 × 10", range: [10, 10], weighted: false },
      { name: "Band ER + Face-pull", scheme: "2 × 15–20", range: [15, 20], weighted: true },
      { name: "Bar Hang (passive/active)", scheme: "2 × 30–60s", range: [30, 60], weighted: false },
      { name: "Light Turkish Get-up", scheme: "2/side, crisp", range: [2, 2], weighted: true },
    ],
  },
  JOG: {
    name: "Zone 2 Jog",
    day: "Sat (Sun if rolling Sat)",
    color: "#9B7ED8",
    exercises: [],
    warmup: [
      "Brisk walk 3–5 min",
      "Leg swings × 10/side + ankle bounces × 20",
      "Spanish squat ISO 3 × 30s — knee primer before impact",
      "A-skips or high-knee march 2 × 20m",
      "First 5 min of the run: deliberately slower than feels natural",
    ],
  },
  BJJ: {
    name: "BJJ",
    day: "Fri (+ occasional Wed/Sat)",
    color: C.red,
    exercises: [],
    warmup: [
      "Joint circles: neck, shoulders, hips, knees, ankles — 60s",
      "Spanish squat ISO 3 × 30s — knee primer before rolling",
      "Hip openers: 90/90 switches × 6/side",
      "Bridges × 10 + shrimps × 10",
      "Technical stand-ups × 5/side",
      "Light drilling before hard rolls — no long static stretching first",
    ],
  },
};

export const WEEK_PLAN = [
  { d: "Mon", type: "B" },
  { d: "Tue", type: "A" },
  { d: "Wed", type: "REST", opt: "BJJ" },
  { d: "Thu", type: "C" },
  { d: "Fri", type: "BJJ" },
  { d: "Sat", type: "JOG", opt: "BJJ" },
  { d: "Sun", type: "REST" },
];

export const NIGGLE_AREAS = [
  "Knee (R)",
  "Knee (L)",
  "Shoulder (R)",
  "Shoulder (L)",
  "Trap",
  "Lower back",
  "Neck",
  "Elbow",
  "Wrist",
  "Hip",
  "Ankle",
  "Other",
];

export const SESSION_TYPES = ["A", "B", "C", "MOB", "JOG", "BJJ"];
