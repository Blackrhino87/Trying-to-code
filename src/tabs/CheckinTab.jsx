import React, { useState, useRef, useEffect } from "react";
import { C, NIGGLE_AREAS } from "../lib/program.js";
import { todayStr, uid } from "../lib/format.js";
import { Card, Label, NumInput, Scale10, PrimaryButton } from "../components/ui.jsx";

export default function CheckinTab({ data, persist }) {
  const existing = data.checkins.find((c) => c.date === todayStr());

  const [sleepH, setSleepH] = useState(existing?.sleepH ?? "");
  const [sleepQ, setSleepQ] = useState(existing?.sleepQ ?? null);
  const [energy, setEnergy] = useState(existing?.energy ?? null);
  const [hangSec, setHangSec] = useState(existing?.hangSec ?? "");
  const [niggles, setNiggles] = useState(existing?.niggles ?? []);
  const [area, setArea] = useState(NIGGLE_AREAS[0]);
  const [score, setScore] = useState(null);
  const [note, setNote] = useState("");

  /* If a background sync pulls today's check-in from another device, adopt
     it — but never overwrite something Ryan is part-way through typing. */
  const touched = useRef(false);
  const seenStamp = useRef(existing?.updatedAt ?? null);
  useEffect(() => {
    const stamp = existing?.updatedAt ?? null;
    if (touched.current || stamp === seenStamp.current) return;
    seenStamp.current = stamp;
    setSleepH(existing?.sleepH ?? "");
    setSleepQ(existing?.sleepQ ?? null);
    setEnergy(existing?.energy ?? null);
    setHangSec(existing?.hangSec ?? "");
    setNiggles(existing?.niggles ?? []);
  }, [existing]);

  const edit = (setter) => (v) => { touched.current = true; setter(v); };

  const addNiggle = () => {
    if (!score) return;
    touched.current = true;
    setNiggles((n) => [...n, { id: uid(), area, score, note }]);
    setScore(null);
    setNote("");
  };

  const save = () => {
    const entry = {
      id: existing?.id || uid(),
      date: todayStr(),
      sleepH, sleepQ, energy, hangSec, niggles,
    };
    const others = data.checkins.filter((c) => c.date !== todayStr());
    persist({ ...data, checkins: [...others, entry] });
    touched.current = false;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        Morning check-in {existing && <span style={{ color: C.green, fontSize: 14 }}>· logged today ✓</span>}
      </div>

      <Card>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div>
            <Label>Sleep</Label>
            <NumInput value={sleepH} onChange={edit(setSleepH)} placeholder="7.5" suffix="hrs" width={72} />
          </div>
          <div>
            <Label>Dead hang (gym days)</Label>
            <NumInput value={hangSec} onChange={edit(setHangSec)} placeholder="45" suffix="sec" width={72} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Label>Sleep quality</Label>
          <Scale10 value={sleepQ} onChange={edit(setSleepQ)} color={C.blue} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Label>Energy / mood</Label>
          <Scale10 value={energy} onChange={edit(setEnergy)} color={C.green} />
        </div>
      </Card>

      <Card>
        <Label>Niggles &amp; soreness</Label>
        {niggles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {niggles.map((n) => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.ink, borderRadius: 8, padding: "8px 12px", border: `1px solid ${n.score >= 6 ? C.red : C.line}` }}>
                <div style={{ fontSize: 14 }}>
                  <strong>{n.area}</strong> — <span style={{ color: n.score >= 6 ? C.red : n.score >= 4 ? C.gold : C.green, fontWeight: 700 }}>{n.score}/10</span>
                  {n.note && <span style={{ color: C.dim, fontSize: 12 }}> · {n.note}</span>}
                </div>
                <button onClick={() => { touched.current = true; setNiggles((ns) => ns.filter((x) => x.id !== n.id)); }}
                  style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={area} onChange={(e) => setArea(e.target.value)}
            style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "9px 10px", fontSize: 16, fontFamily: "inherit" }}>
            {NIGGLE_AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 10 }}><Scale10 value={score} onChange={setScore} color={C.red} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. patella tight after BJJ, eased with warm-up"
            style={{ flex: 1, minWidth: 0, background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "9px 10px", fontSize: 16, fontFamily: "inherit" }} />
          <button onClick={addNiggle} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "0 16px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
        </div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>Watch the knee and shoulder daily. Trends matter, not single days.</div>
      </Card>

      <PrimaryButton onClick={save}>{existing ? "Update check-in" : "Save check-in"}</PrimaryButton>
    </div>
  );
}
