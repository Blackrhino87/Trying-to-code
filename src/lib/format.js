/* Small pure helpers. Kept free of React so tests can import them directly. */

export const todayStr = () => {
  // Local calendar date, not UTC — a 01:00 SAST log belongs to today, not yesterday.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const fmtDate = (s) => {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export const nowIso = () => new Date().toISOString();

/** Monday of the week containing `d` (a Date), as YYYY-MM-DD. */
export const mondayOf = (d) => {
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const off = mon.getTimezoneOffset();
  return new Date(mon.getTime() - off * 60000).toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------
   Coach review export.

   Ryan pastes this into a Claude chat every 4–6 weeks for a training
   block review. The exact text format is a product decision — do not
   reformat, reorder or "tidy" these lines.
   ------------------------------------------------------------------ */
export function buildReviewExport(data) {
  const lines = ["FIGHT CAMP DATA EXPORT — " + todayStr(), ""];
  lines.push("== SESSIONS ==");
  [...data.sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((s) => {
      lines.push(
        `${s.date} | ${s.type} | sRPE ${s.sessionRPE ?? "-"} | ${s.minutes || "-"}min${s.notes ? " | " + s.notes : ""}`
      );
      (s.exercises || []).forEach((e) => {
        const sets = (e.sets || [])
          .map((st) => `${st.kg || 0}kg×${st.reps}${st.rpe ? "@" + st.rpe : ""}`)
          .join(", ");
        lines.push(`  ${e.name}: ${sets}`);
      });
    });
  lines.push("", "== CHECK-INS ==");
  [...data.checkins]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((c) => {
      const ng =
        (c.niggles || [])
          .map((n) => `${n.area} ${n.score}/10${n.note ? " (" + n.note + ")" : ""}`)
          .join("; ") || "none";
      lines.push(
        `${c.date} | sleep ${c.sleepH || "-"}h q${c.sleepQ ?? "-"} | energy ${c.energy ?? "-"} | hang ${c.hangSec || "-"}s | niggles: ${ng}`
      );
    });
  return lines.join("\n");
}
