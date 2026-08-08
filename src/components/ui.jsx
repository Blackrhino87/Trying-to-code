import React from "react";
import { C } from "../lib/program.js";

export const Label = ({ children }) => (
  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.dim, fontWeight: 600, marginBottom: 6 }}>{children}</div>
);

export const NumInput = ({ value, onChange, placeholder, width = 64, suffix }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
    <input
      type="number" inputMode="decimal" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
        color: C.text, padding: "8px 8px", fontSize: 16, fontFamily: "inherit", textAlign: "center",
      }}
    />
    {suffix && <span style={{ color: C.dim, fontSize: 12 }}>{suffix}</span>}
  </div>
);

export const Chip = ({ active, onClick, children, color = C.gold }) => (
  <button onClick={onClick} style={{
    padding: "7px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
    background: active ? color : "transparent",
    color: active ? C.ink : C.dim,
    border: `1px solid ${active ? color : C.line}`,
    fontFamily: "inherit", transition: "all .15s",
  }}>{children}</button>
);

/* Ten buttons across, always on one row. Fixed 30px cells overflowed a
   390pt iPhone and wrapped "10" onto a line of its own. */
export const Scale10 = ({ value, onChange, color = C.gold }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
      <button key={n} onClick={() => onChange(n)} style={{
        flex: "1 1 0", minWidth: 0, maxWidth: 44, height: 34,
        borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
        background: value === n ? color : C.ink,
        color: value === n ? C.ink : C.dim,
        border: `1px solid ${value === n ? color : C.line}`, fontFamily: "inherit",
      }}>{n}</button>
    ))}
  </div>
);

export const Card = ({ children, style }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, ...style }}>{children}</div>
);

export const PrimaryButton = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{
    background: C.gold, color: C.ink, border: "none", borderRadius: 12, padding: "15px 0",
    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "0.08em",
    textTransform: "uppercase", cursor: "pointer", ...style,
  }}>{children}</button>
);
