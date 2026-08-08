import React, { useState, useEffect } from "react";
import { C } from "../lib/program.js";
import { Card } from "./ui.jsx";

/* Tickable checklist, resets whenever the session type changes. */
export default function WarmupCard({ items, color }) {
  const [done, setDone] = useState({});
  const [open, setOpen] = useState(true);
  useEffect(() => { setDone({}); setOpen(true); }, [items]);

  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <Card>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0, fontFamily: "inherit" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.dim, fontWeight: 600 }}>
          Warm-up · {doneCount}/{items.length}
        </span>
        <span style={{ color: doneCount === items.length ? C.green : C.dim, fontSize: 13, fontWeight: 700 }}>
          {doneCount === items.length ? "Ready ✓" : open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
          {items.map((it, i) => (
            <button key={i} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} style={{
              display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left", cursor: "pointer",
              background: done[i] ? C.ink : "transparent", border: "none", borderRadius: 8, padding: "7px 8px", fontFamily: "inherit",
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                border: `2px solid ${done[i] ? color : C.line}`,
                background: done[i] ? color : "transparent",
                color: C.ink, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{done[i] ? "✓" : ""}</span>
              <span style={{ fontSize: 13.5, color: done[i] ? C.dim : C.text, textDecoration: done[i] ? "line-through" : "none", lineHeight: 1.45 }}>{it}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
