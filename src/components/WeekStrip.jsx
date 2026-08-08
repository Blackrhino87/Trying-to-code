import React from "react";
import { C, PROGRAM, WEEK_PLAN } from "../lib/program.js";
import { todayStr } from "../lib/format.js";

/* The signature element: this week's fight camp at a glance. */
export default function WeekStrip({ sessions }) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const days = WEEK_PLAN.map((p, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = localDate(d);
    const done = sessions.some((s) => s.date === ds);
    return { ...p, ds, done, isToday: ds === todayStr() };
  });

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
      {days.map((d) => {
        const col = d.type === "REST" ? C.dim : PROGRAM[d.type]?.color || C.dim;
        return (
          <div key={d.ds} style={{
            flex: 1, textAlign: "center", padding: "8px 0 6px", borderRadius: 10,
            background: d.isToday ? C.panel2 : "transparent",
            border: `1px solid ${d.isToday ? col : "transparent"}`,
          }}>
            <div style={{ fontSize: 10, color: C.dim, fontWeight: 600 }}>{d.d}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: col, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {d.type === "REST" ? "—" : d.type}
            </div>
            {/* Reserved on every day so the done-dots stay on one line. */}
            <div style={{ fontSize: 8, height: 11, color: C.red, fontWeight: 700, letterSpacing: "0.05em" }}>
              {d.opt ? "BJJ?" : ""}
            </div>
            <div style={{ width: 6, height: 6, borderRadius: 3, margin: "4px auto 0", background: d.done ? C.green : C.line }} />
          </div>
        );
      })}
    </div>
  );
}

/* Local calendar date — never UTC. At 01:00 in SAST the UTC date is still
   yesterday, which used to light up the wrong day of the week strip. */
function localDate(d) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
