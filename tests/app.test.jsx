import React from "react";
import { describe, it, expect } from "vitest";
import { render, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import App from "../src/App.jsx";
import { STORAGE_KEY } from "../src/lib/storage.js";
import { todayStr } from "../src/lib/format.js";

/* No VITE_SUPABASE_* in the test env, so the app runs in its local-only
   mode: no network, no auth gate, localStorage is the whole story. That is
   exactly the path we care about — it is the one that must never lose data. */

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
const buttons = () => [...document.querySelectorAll("button")];
const byText = (t) => buttons().find((b) => b.textContent.trim().toLowerCase() === t.toLowerCase());
const containing = (t) => buttons().find((b) => b.textContent.toLowerCase().includes(t.toLowerCase()));
const numbers = () => [...document.querySelectorAll("input[type=number]")];
const click = async (el) => { await act(async () => { fireEvent.click(el); }); };
const type = async (el, v) => { await act(async () => { fireEvent.change(el, { target: { value: String(v) } }); }); };

async function boot() {
  const r = render(<App />);
  await act(async () => {});
  return r;
}

describe("sign-in gate", () => {
  it("asks for an email, and lets you skip straight into local-only mode", async () => {
    localStorage.removeItem("fight-camp-local-only");
    await boot();
    expect(document.body.textContent).toContain("Sign in to keep your training backed up");
    expect(document.querySelector('input[type="email"]')).toBeTruthy();

    await click(containing("Skip"));
    expect(containing("Log session")).toBeTruthy();
    expect(localStorage.getItem("fight-camp-local-only")).toBe("1");
  });
});

describe("first boot", () => {
  it("renders the header and the whole week strip", async () => {
    await boot();
    expect(document.body.textContent).toContain("Camp");
    for (const d of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      expect(document.body.textContent).toContain(d);
    }
  });

  it("opens on the Train tab with no data and does not crash", async () => {
    await boot();
    expect(containing("Log session")).toBeTruthy();
  });

  it("prefills Session A's exercises when picked", async () => {
    await boot();
    await click(byText("Session A"));
    expect(document.body.textContent).toContain("Weighted Pull-up");
    expect(document.body.textContent).toContain("Turkish Get-up");
  });
});

describe("logging a session", () => {
  it("persists sets, session RPE and duration, then clears the form", async () => {
    await boot();
    await click(byText("Session A"));

    const n = numbers();
    expect(n.length).toBeGreaterThanOrEqual(3);
    await type(n[0], 32.5);
    await type(n[1], 5);
    await type(n[2], 8);

    // add a second set — the load should carry over from the previous one
    await click(buttons().filter((b) => b.textContent.includes("Add set"))[0]);
    const n2 = numbers();
    expect(n2[3].value).toBe("32.5");
    await type(n2[4], 4);
    await type(n2[5], 8);

    await click(byText("7"));                                   // session RPE
    await type(numbers().find((i) => i.placeholder === "65"), 68); // duration
    expect(document.body.textContent).toContain("476");          // 7 × 68

    await click(containing("Log session"));

    const saved = stored();
    expect(saved.sessions).toHaveLength(1);
    const sets = saved.sessions[0].exercises[0].sets;
    expect(sets).toHaveLength(2);
    expect(sets[0].kg).toBe("32.5");
    expect(sets[1].reps).toBe("4");
    expect(saved.sessions[0].sessionRPE).toBe(7);
    expect(saved.sessions[0].minutes).toBe("68");
    expect(saved.sessions[0].updatedAt).toBeTruthy();

    expect(numbers()[0].value).toBe("");
  });

  it("survives a force-close: reopening shows the progression hint", async () => {
    await boot();
    await click(byText("Session A"));
    const n = numbers();
    await type(n[0], 32.5);
    await type(n[1], 5);
    await type(n[2], 8);
    await click(containing("Log session"));

    cleanup();               // force-close Safari
    await boot();            // reopen from the home screen
    await click(byText("Session A"));

    expect(document.body.textContent).toContain("Last top set: 32.5kg × 5");
  });
});

describe("morning check-in", () => {
  const openCheckin = async () => click(byText("Check-in"));

  it("saves once per day and updates in place instead of duplicating", async () => {
    await boot();
    await openCheckin();

    await type(numbers().find((i) => i.placeholder === "7.5"), 7);
    await type(numbers().find((i) => i.placeholder === "45"), 52);

    const scale = (n, row) => buttons().filter((b) => b.textContent.trim() === String(n))[row];
    await click(scale(8, 0)); // sleep quality
    await click(scale(7, 1)); // energy

    const select = document.querySelector("select");
    await act(async () => { fireEvent.change(select, { target: { value: "Knee (R)" } }); });
    await click(scale(3, 2)); // niggle severity
    await type(document.querySelector('input[placeholder*="patella"]'), "tight after rolling");
    await click(byText("Add"));

    expect(document.body.textContent).toContain("Knee (R)");
    expect(document.body.textContent).toContain("3/10");

    await click(containing("Save check-in"));

    let saved = stored();
    expect(saved.checkins).toHaveLength(1);
    expect(saved.checkins[0].hangSec).toBe("52");
    expect(saved.checkins[0].date).toBe(todayStr());
    expect(saved.checkins[0].niggles).toHaveLength(1);

    // same day, second save
    await type(numbers().find((i) => i.placeholder === "45"), 50);
    await click(containing("Update check-in"));

    saved = stored();
    expect(saved.checkins).toHaveLength(1);
    expect(saved.checkins[0].hangSec).toBe("50");
    expect(saved.checkins[0].niggles[0].note).toBe("tight after rolling");
  });

  it("shows the deload banner once the data says to back off", async () => {
    const daysAgo = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      const off = d.getTimezoneOffset();
      return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessions: [],
      checkins: [
        ...[7, 6, 5, 4, 3, 2, 1].map((i) => ({ id: "c" + i, date: daysAgo(i), hangSec: "52", niggles: [] })),
        { id: "c0", date: daysAgo(0), hangSec: "44", niggles: [{ id: "n1", area: "Trap", score: 7, note: "flared" }] },
      ],
      tombstones: [],
    }));

    await boot();
    expect(document.body.textContent).toContain("Deload signal");
    expect(document.body.textContent).toContain("dead hang is down");
    expect(document.body.textContent).toContain("niggle is scoring");
  });
});

describe("program tab", () => {
  const seed = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
    sessions: [
      { id: "s1", date: "2026-08-08", type: "A", name: "Session A — Upper Pull", sessionRPE: 7, minutes: "65",
        exercises: [{ id: "e1", name: "Weighted Pull-up", sets: [{ id: "x1", kg: "30", reps: "5", rpe: "7" }] }],
        updatedAt: "2026-08-08T10:00:00.000Z" },
      { id: "s2", date: "2026-08-10", type: "C", name: "Session C — Upper Push", sessionRPE: 8, minutes: "60",
        exercises: [{ id: "e2", name: "Dip (shoulder-safe)", sets: [{ id: "x2", kg: "40", reps: "5", rpe: "8" }] }],
        updatedAt: "2026-08-10T10:00:00.000Z" },
    ],
    checkins: [],
    tombstones: [],
  }));

  it("lists the program reference and recent sessions", async () => {
    seed();
    await boot();
    await click(byText("Program"));
    expect(document.body.textContent).toContain("Upper Pull");
    expect(document.body.textContent).toContain("Lower (Knee)");
    expect(document.body.textContent).toContain("Upper Push");
    expect(document.body.textContent).toContain("Recent sessions");
  });

  it("deletes a single session and leaves a tombstone", async () => {
    seed();
    await boot();
    await click(byText("Program"));
    await click(buttons().filter((b) => b.textContent.trim() === "×")[0]);

    const saved = stored();
    expect(saved.sessions).toHaveLength(1);
    expect(saved.tombstones).toHaveLength(1);
    expect(saved.tombstones[0].kind).toBe("session");
  });

  it("asks before resetting, and keeps the data if you back out", async () => {
    seed();
    await boot();
    await click(byText("Program"));

    await click(containing("Reset all data"));
    expect(document.body.textContent).toContain("Delete every session");

    await click(containing("Keep my data"));
    expect(stored().sessions).toHaveLength(2);

    await click(containing("Reset all data"));
    await click(containing("Yes, reset"));
    const saved = stored();
    expect(saved.sessions).toHaveLength(0);
    expect(saved.checkins).toHaveLength(0);
  });
});

describe("progress tab", () => {
  it("renders every chart without crashing on real data", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessions: [
        { id: "s1", date: "2026-08-08", type: "A", sessionRPE: 7, minutes: "65",
          exercises: [{ id: "e1", name: "Weighted Pull-up", sets: [{ id: "x1", kg: "30", reps: "5", rpe: "7" }] }] },
        { id: "s2", date: "2026-08-10", type: "C", sessionRPE: 8, minutes: "60",
          exercises: [{ id: "e2", name: "Dip (shoulder-safe)", sets: [{ id: "x2", kg: "40", reps: "5", rpe: "8" }] }] },
      ],
      checkins: [
        { id: "c1", date: "2026-08-08", sleepH: "7", sleepQ: 7, energy: 7, hangSec: "52", niggles: [] },
        { id: "c2", date: "2026-08-09", sleepH: "6", sleepQ: 5, energy: 5, hangSec: "48", niggles: [{ id: "n", area: "Trap", score: 4 }] },
      ],
      tombstones: [],
    }));

    await boot();
    await click(byText("Progress"));
    // ProgressTab is code-split — wait for the chunk before asserting.
    await waitFor(() => expect(document.body.textContent).toContain("Top set progression"));

    expect(document.body.textContent).toContain("Readiness");
    expect(document.body.textContent).toContain("Weekly training load");

    await click(byText("Dip (shoulder-safe)"));
    expect(document.body.textContent).toContain("Top set progression");
  });
});
