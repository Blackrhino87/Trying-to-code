import { describe, it, expect } from "vitest";
import { PROGRAM, WEEK_PLAN, NIGGLE_AREAS } from "../src/lib/program.js";
import { buildReviewExport, todayStr } from "../src/lib/format.js";
import { computeReadiness } from "../src/lib/deload.js";
import { normalize, stampChanges } from "../src/lib/storage.js";
import { mergeData, toSessionRow, fromSessionRow, toCheckinRow, fromCheckinRow } from "../src/lib/sync.js";

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------
   The program is a product decision. These tests exist so a future
   refactor can't quietly "improve" the protocol.
   ------------------------------------------------------------------ */
describe("program integrity", () => {
  it("keeps the six session types with their approved names", () => {
    expect(Object.keys(PROGRAM)).toEqual(["A", "B", "C", "MOB", "JOG", "BJJ"]);
    expect(PROGRAM.A.name).toBe("Session A — Upper Pull");
    expect(PROGRAM.B.name).toBe("Session B — Lower (Knee)");
    expect(PROGRAM.C.name).toBe("Session C — Upper Push");
  });

  it("keeps Session A's exercises and schemes exactly", () => {
    expect(PROGRAM.A.exercises.map((e) => e.name)).toEqual([
      "Weighted Pull-up",
      "KB / Chest-supported Row",
      "Turkish Get-up",
      "Hanging Leg Raise",
      "Bar Hang / Farmer Hold",
    ]);
    expect(PROGRAM.A.exercises[0].scheme).toBe("4–5 × 3–5 @ RPE 7–8");
  });

  it("keeps the warm-up checklists", () => {
    expect(PROGRAM.A.warmup).toHaveLength(7);
    expect(PROGRAM.B.warmup).toHaveLength(8);
    expect(PROGRAM.C.warmup).toHaveLength(7);
    expect(PROGRAM.B.warmup[0]).toMatch(/Bike/);
  });

  it("keeps the week plan: Mon B, Tue A, Wed rest, Thu C, Fri BJJ, Sat jog, Sun rest", () => {
    expect(WEEK_PLAN.map((d) => `${d.d}:${d.type}`)).toEqual([
      "Mon:B", "Tue:A", "Wed:REST", "Thu:C", "Fri:BJJ", "Sat:JOG", "Sun:REST",
    ]);
    expect(WEEK_PLAN[2].opt).toBe("BJJ");
    expect(WEEK_PLAN[5].opt).toBe("BJJ");
  });

  it("includes Trap in the niggle areas", () => {
    expect(NIGGLE_AREAS).toContain("Trap");
    expect(NIGGLE_AREAS).toContain("Shoulder (R)");
  });
});

/* ------------------------------------------------------------------ */
describe("deload triggers", () => {
  const baselineWeek = () =>
    [7, 6, 5, 4, 3, 2, 1].map((i) => ({
      id: "c" + i, date: daysAgo(i), sleepH: "7", sleepQ: 7, energy: 7, hangSec: "52", niggles: [],
    }));

  it("fires when the dead hang drops more than 10% below baseline", () => {
    const checkins = [
      ...baselineWeek(),
      { id: "c0", date: daysAgo(0), hangSec: "44", niggles: [] }, // 44 < 52*0.9 = 46.8
    ];
    const r = computeReadiness(checkins);
    expect(r.baseline).toBeCloseTo(52);
    expect(r.hangAlert).toBe(true);
  });

  it("stays quiet for a drop inside 10%", () => {
    const checkins = [
      ...baselineWeek(),
      { id: "c0", date: daysAgo(0), hangSec: "48", niggles: [] }, // 48 > 46.8
    ];
    expect(computeReadiness(checkins).hangAlert).toBe(false);
  });

  it("fires on any niggle scoring 6 or worse, and not at 5", () => {
    const at = (score) => [{ id: "c0", date: daysAgo(0), hangSec: "", niggles: [{ id: "n", area: "Trap", score }] }];
    expect(computeReadiness(at(6)).niggleAlert).toBe(true);
    expect(computeReadiness(at(7)).niggleAlert).toBe(true);
    expect(computeReadiness(at(5)).niggleAlert).toBe(false);
  });

  it("ignores check-ins with no hang recorded when building the baseline", () => {
    const checkins = [
      { id: "a", date: daysAgo(3), hangSec: "", niggles: [] },
      { id: "b", date: daysAgo(2), hangSec: "50", niggles: [] },
      { id: "c", date: daysAgo(1), hangSec: "50", niggles: [] },
      { id: "d", date: daysAgo(0), hangSec: "40", niggles: [] },
    ];
    const r = computeReadiness(checkins);
    expect(r.baseline).toBeCloseTo(50);
    expect(r.hangAlert).toBe(true);
  });

  it("is silent with no history at all", () => {
    const r = computeReadiness([]);
    expect(r.alert).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
describe("coach review export", () => {
  it("matches the exact text format Ryan pastes into Claude", () => {
    const data = {
      sessions: [
        {
          id: "s1", date: "2026-08-08", type: "A", sessionRPE: 7, minutes: "68", notes: "felt strong",
          exercises: [
            { id: "e1", name: "Weighted Pull-up", sets: [
              { id: "x1", kg: "32.5", reps: "5", rpe: "8" },
              { id: "x2", kg: "32.5", reps: "4", rpe: "8" },
            ] },
            { id: "e2", name: "Hanging Leg Raise", sets: [{ id: "x3", kg: "", reps: "10", rpe: "" }] },
          ],
        },
      ],
      checkins: [
        { id: "c1", date: "2026-08-08", sleepH: "7", sleepQ: 8, energy: 7, hangSec: "52",
          niggles: [{ id: "n1", area: "Trap", score: 4, note: "tight" }] },
        { id: "c2", date: "2026-08-09", sleepH: "", sleepQ: null, energy: null, hangSec: "", niggles: [] },
      ],
    };

    expect(buildReviewExport(data)).toBe(
      [
        `FIGHT CAMP DATA EXPORT — ${todayStr()}`,
        "",
        "== SESSIONS ==",
        "2026-08-08 | A | sRPE 7 | 68min | felt strong",
        "  Weighted Pull-up: 32.5kg×5@8, 32.5kg×4@8",
        "  Hanging Leg Raise: 0kg×10",
        "",
        "== CHECK-INS ==",
        "2026-08-08 | sleep 7h q8 | energy 7 | hang 52s | niggles: Trap 4/10 (tight)",
        "2026-08-09 | sleep -h q- | energy - | hang -s | niggles: none",
      ].join("\n")
    );
  });
});

/* ------------------------------------------------------------------ */
describe("legacy migration", () => {
  it("maps the artifact-era gripKg field onto hangSec", () => {
    const out = normalize({
      sessions: [],
      checkins: [{ id: "c1", date: "2026-08-08", gripKg: "52", niggles: [] }],
    });
    expect(out.checkins[0].hangSec).toBe("52");
    expect(out.checkins[0].gripKg).toBeUndefined();
  });

  it("survives junk input without throwing", () => {
    expect(normalize(null)).toEqual({ sessions: [], checkins: [], tombstones: [] });
    expect(normalize({ sessions: "nope" }).sessions).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
describe("change stamping and tombstones", () => {
  const base = { sessions: [{ id: "s1", date: "2026-08-08", type: "A", exercises: [] }], checkins: [], tombstones: [] };

  it("stamps new and edited records, leaves untouched ones alone", () => {
    const first = stampChanges({ sessions: [], checkins: [], tombstones: [] }, base, "2026-08-08T10:00:00.000Z");
    expect(first.sessions[0].updatedAt).toBe("2026-08-08T10:00:00.000Z");

    const edited = { ...first, sessions: [{ ...first.sessions[0], notes: "changed" }] };
    const second = stampChanges(first, edited, "2026-08-08T11:00:00.000Z");
    expect(second.sessions[0].updatedAt).toBe("2026-08-08T11:00:00.000Z");

    const third = stampChanges(second, second, "2026-08-08T12:00:00.000Z");
    expect(third.sessions[0].updatedAt).toBe("2026-08-08T11:00:00.000Z");
  });

  it("records a tombstone when a session is deleted", () => {
    const first = stampChanges({ sessions: [], checkins: [], tombstones: [] }, base, "2026-08-08T10:00:00.000Z");
    const after = stampChanges(first, { ...first, sessions: [] }, "2026-08-08T11:00:00.000Z");
    expect(after.sessions).toHaveLength(0);
    expect(after.tombstones).toEqual([{ kind: "session", key: "s1", at: "2026-08-08T11:00:00.000Z" }]);
  });

  it("keys check-in tombstones by date, because one date is one check-in", () => {
    const withCheckin = stampChanges(
      { sessions: [], checkins: [], tombstones: [] },
      { sessions: [], checkins: [{ id: "c1", date: "2026-08-08", niggles: [] }], tombstones: [] },
      "2026-08-08T10:00:00.000Z"
    );
    const after = stampChanges(withCheckin, { ...withCheckin, checkins: [] }, "2026-08-08T11:00:00.000Z");
    expect(after.tombstones[0]).toEqual({ kind: "checkin", key: "2026-08-08", at: "2026-08-08T11:00:00.000Z" });
  });
});

/* ------------------------------------------------------------------ */
describe("sync merge", () => {
  const local = {
    sessions: [{ id: "s1", date: "2026-08-08", type: "A", notes: "local", exercises: [], updatedAt: "2026-08-08T12:00:00.000Z" }],
    checkins: [],
    tombstones: [],
  };

  it("keeps the newer copy of a record that exists on both sides", () => {
    const remote = {
      sessions: [{ id: "s1", date: "2026-08-08", type: "A", notes: "remote", exercises: [], updatedAt: "2026-08-08T13:00:00.000Z" }],
      checkins: [],
    };
    expect(mergeData(local, remote).sessions[0].notes).toBe("remote");
    expect(mergeData(remote, local).sessions[0].notes).toBe("remote");
  });

  it("unions records that only exist on one side", () => {
    const remote = {
      sessions: [{ id: "s2", date: "2026-08-09", type: "C", exercises: [], updatedAt: "2026-08-09T09:00:00.000Z" }],
      checkins: [{ id: "c1", date: "2026-08-09", niggles: [], updatedAt: "2026-08-09T09:00:00.000Z" }],
    };
    const merged = mergeData(local, remote);
    expect(merged.sessions.map((s) => s.id)).toEqual(["s1", "s2"]);
    expect(merged.checkins).toHaveLength(1);
  });

  it("does not resurrect a record deleted locally", () => {
    const withTombstone = {
      sessions: [],
      checkins: [],
      tombstones: [{ kind: "session", key: "s1", at: "2026-08-08T14:00:00.000Z" }],
    };
    const remote = { sessions: local.sessions, checkins: [] };
    const merged = mergeData(withTombstone, remote);
    expect(merged.sessions).toHaveLength(0);
    expect(merged.tombstones).toHaveLength(1);
  });

  it("lets a remote edit made after the delete win", () => {
    const withTombstone = {
      sessions: [], checkins: [],
      tombstones: [{ kind: "session", key: "s1", at: "2026-08-08T14:00:00.000Z" }],
    };
    const remote = {
      sessions: [{ id: "s1", date: "2026-08-08", type: "A", exercises: [], updatedAt: "2026-08-08T15:00:00.000Z" }],
      checkins: [],
    };
    const merged = mergeData(withTombstone, remote);
    expect(merged.sessions).toHaveLength(1);
    expect(merged.tombstones).toHaveLength(0);
  });

  it("collapses two check-ins for the same date down to the newer one", () => {
    const mine = {
      sessions: [],
      checkins: [{ id: "local-id", date: "2026-08-08", hangSec: "50", niggles: [], updatedAt: "2026-08-08T10:00:00.000Z" }],
      tombstones: [],
    };
    const theirs = {
      sessions: [],
      checkins: [{ id: "remote-id", date: "2026-08-08", hangSec: "52", niggles: [], updatedAt: "2026-08-08T11:00:00.000Z" }],
    };
    const merged = mergeData(mine, theirs);
    expect(merged.checkins).toHaveLength(1);
    expect(merged.checkins[0].hangSec).toBe("52");
  });

  it("compares Postgres +00:00 timestamps against local Z timestamps correctly", () => {
    const mine = {
      sessions: [{ id: "s1", date: "2026-08-08", type: "A", notes: "local", exercises: [], updatedAt: "2026-08-08T12:00:00.000Z" }],
      checkins: [], tombstones: [],
    };
    const fromPg = {
      sessions: [fromSessionRow({
        id: "s1", date: "2026-08-08", type: "A", notes: "remote", exercises: [],
        updated_at: "2026-08-08 13:00:00+00",
      })],
      checkins: [],
    };
    expect(mergeData(mine, fromPg).sessions[0].notes).toBe("remote");
  });
});

/* ------------------------------------------------------------------ */
describe("row mapping", () => {
  it("round-trips a session through the Postgres shape", () => {
    const s = {
      id: "s1", date: "2026-08-08", type: "A", name: "Session A — Upper Pull",
      sessionRPE: 7, minutes: "68", notes: "n",
      exercises: [{ id: "e1", name: "Weighted Pull-up", sets: [{ id: "x", kg: "32.5", reps: "5", rpe: "8" }] }],
      updatedAt: "2026-08-08T12:00:00.000Z",
    };
    expect(fromSessionRow(toSessionRow("user-1", s))).toEqual(s);
  });

  it("round-trips a check-in, including a null RPE-style field", () => {
    const c = {
      id: "c1", date: "2026-08-08", sleepH: "7", sleepQ: 8, energy: null, hangSec: "52",
      niggles: [{ id: "n1", area: "Trap", score: 4, note: "" }],
      updatedAt: "2026-08-08T12:00:00.000Z",
    };
    expect(fromCheckinRow(toCheckinRow("user-1", c))).toEqual(c);
  });

  it("scopes every row to the signed-in user", () => {
    expect(toSessionRow("user-1", { id: "s", date: "2026-08-08", type: "A" }).user_id).toBe("user-1");
    expect(toCheckinRow("user-1", { id: "c", date: "2026-08-08" }).user_id).toBe("user-1");
  });
});
