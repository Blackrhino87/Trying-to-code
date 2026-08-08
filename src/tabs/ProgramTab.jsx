import React, { useState } from "react";
import { C, PROGRAM } from "../lib/program.js";
import { fmtDate, todayStr, buildReviewExport } from "../lib/format.js";
import { Card, Label } from "../components/ui.jsx";

export default function ProgramTab({ data, persist, account }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);
  const history = [...data.sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const copyReview = () => {
    const txt = buildReviewExport(data);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(txt)
        .then(() => setExportMsg("Copied — paste it to Claude and ask for a block review"))
        .catch(() => setExportMsg(txt));
    } else setExportMsg(txt);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fight-camp-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {["A", "B", "C", "MOB"].map((k) => (
        <Card key={k}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 20, textTransform: "uppercase", letterSpacing: "0.03em", color: PROGRAM[k].color, marginBottom: 8 }}>
            {PROGRAM[k].name} <span style={{ color: C.dim, fontSize: 14 }}>· {PROGRAM[k].day}</span>
          </div>
          {(PROGRAM[k].warmup || []).length > 0 && (
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 8, lineHeight: 1.5 }}>
              <strong style={{ color: C.text }}>Warm-up:</strong> {PROGRAM[k].warmup.length} steps — aerobic → dynamic prep → ramp-up. Full checklist in Train.
            </div>
          )}
          {PROGRAM[k].exercises.map((e) => (
            <div key={e.name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.line}`, fontSize: 14 }}>
              <span>{e.name}</span>
              <span style={{ color: C.dim, fontSize: 12, textAlign: "right" }}>{e.scheme}</span>
            </div>
          ))}
        </Card>
      ))}

      <Card>
        <Label>Loading rules (Pavel × Galpin)</Label>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
          <li>~80% loads · RPE 7–8 · never to failure — strength is a skill</li>
          <li>Double progression: fill the rep range, then add 2.5kg and reset</li>
          <li>3–5 min rest on main lifts; 60–90s on accessories</li>
          <li>Deload every 5–8 weeks: volume −50%, keep it crisp</li>
          <li>Dips: chest down, shoulder blades packed, stop above parallel, no rings</li>
          <li>Knee primer before legs &amp; BJJ: 5 × 45s Spanish squat ISO</li>
        </ul>
      </Card>

      {history.length > 0 && (
        <Card>
          <Label>Recent sessions</Label>
          {history.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.line}`, fontSize: 14 }}>
              <div>
                <span style={{ color: PROGRAM[s.type]?.color || C.dim, fontWeight: 700 }}>{s.type}</span>
                <span style={{ color: C.dim, marginLeft: 8, fontSize: 12 }}>{fmtDate(s.date)}</span>
                {s.sessionRPE && <span style={{ color: C.dim, marginLeft: 8, fontSize: 12 }}>RPE {s.sessionRPE}</span>}
              </div>
              <button onClick={() => persist({ ...data, sessions: data.sessions.filter((x) => x.id !== s.id) })}
                style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <Label>Coach review</Label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={copyReview} style={{ background: C.gold, border: "none", borderRadius: 8, color: C.ink, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Copy review data
          </button>
          <button onClick={downloadJson} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Download JSON
          </button>
        </div>
        {exportMsg && (exportMsg.startsWith("Copied") ? (
          <div style={{ fontSize: 12, color: C.green, marginTop: 8 }}>{exportMsg}</div>
        ) : (
          <textarea readOnly value={exportMsg} rows={6} onFocus={(e) => e.target.select()}
            style={{ width: "100%", marginTop: 8, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 11, fontFamily: "monospace" }} />
        ))}
        <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
          Every 4–6 weeks (or when the deload banner fires), copy this and ask Claude for a training block review.
        </div>
      </Card>

      <Card>
        <Label>Data</Label>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: C.dim, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Reset all data…
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: C.red }}>Delete every session and check-in?</span>
            <button onClick={() => { persist({ ...data, sessions: [], checkins: [] }); setConfirmReset(false); }}
              style={{ background: C.red, border: "none", borderRadius: 8, color: C.ink, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Yes, reset
            </button>
            <button onClick={() => setConfirmReset(false)} style={{ background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Keep my data
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: C.dim, marginTop: 10, lineHeight: 1.6 }}>
          {account?.email
            ? <>Saved on this phone the instant you tap, then mirrored to your account (<strong style={{ color: C.text }}>{account.email}</strong>). Losing the phone doesn't lose the training.</>
            : <>Saved on this phone the instant you tap. Sign in to mirror it to your account so a lost phone doesn't lose the training.</>}
        </div>
        {account?.email && (
          <button onClick={account.signOut} style={{ marginTop: 10, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: C.dim, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        )}
      </Card>
    </div>
  );
}
