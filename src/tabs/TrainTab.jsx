import React, { useState, useEffect, useMemo } from "react";
import { C, PROGRAM, WEEK_PLAN, SESSION_TYPES } from "../lib/program.js";
import { todayStr, uid } from "../lib/format.js";
import { Card, Chip, Label, NumInput, Scale10, PrimaryButton } from "../components/ui.jsx";
import WarmupCard from "../components/WarmupCard.jsx";

export default function TrainTab({ data, persist }) {
  const [type, setType] = useState(() => {
    const plan = WEEK_PLAN[(new Date().getDay() + 6) % 7];
    return plan.type === "REST" ? "A" : plan.type;
  });
  const [date, setDate] = useState(todayStr());
  const [exercises, setExercises] = useState([]);
  const [sessionRPE, setSessionRPE] = useState(null);
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");

  /* Last logged performance per exercise, for the progression hint. */
  const lastPerf = useMemo(() => {
    const map = {};
    [...data.sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((s) =>
        (s.exercises || []).forEach((ex) => {
          const top = (ex.sets || []).reduce(
            (best, st) => ((parseFloat(st.kg) || 0) > (parseFloat(best?.kg) || -1) ? st : best),
            null
          );
          if (top) map[ex.name] = top;
        })
      );
    return map;
  }, [data.sessions]);

  useEffect(() => {
    const prog = PROGRAM[type];
    setExercises(
      (prog.exercises || []).map((e) => ({
        id: uid(), name: e.name, scheme: e.scheme,
        sets: [{ id: uid(), kg: "", reps: "", rpe: "" }],
      }))
    );
  }, [type]);

  const updateSet = (exId, setId, field, val) =>
    setExercises((exs) => exs.map((ex) => (ex.id !== exId ? ex : {
      ...ex, sets: ex.sets.map((st) => (st.id === setId ? { ...st, [field]: val } : st)),
    })));

  const addSet = (exId) =>
    setExercises((exs) => exs.map((ex) => {
      if (ex.id !== exId) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { id: uid(), kg: last?.kg || "", reps: "", rpe: "" }] };
    }));

  const removeSet = (exId, setId) =>
    setExercises((exs) => exs.map((ex) => (ex.id !== exId ? ex : { ...ex, sets: ex.sets.filter((s) => s.id !== setId) })));

  const save = async () => {
    const cleaned = exercises
      .map((ex) => ({ ...ex, sets: ex.sets.filter((s) => s.reps !== "" || s.kg !== "") }))
      .filter((ex) => ex.sets.length > 0);
    if (type !== "JOG" && type !== "BJJ" && cleaned.length === 0) return;

    const session = {
      id: uid(), date, type, name: PROGRAM[type].name,
      exercises: cleaned, sessionRPE, minutes, notes,
    };
    await persist({ ...data, sessions: [...data.sessions, session] });

    setSessionRPE(null); setMinutes(""); setNotes("");
    const prog = PROGRAM[type];
    setExercises(
      (prog.exercises || []).map((e) => ({
        id: uid(), name: e.name, scheme: e.scheme,
        sets: [{ id: uid(), kg: "", reps: "", rpe: "" }],
      }))
    );
  };

  const isLift = type === "A" || type === "B" || type === "C" || type === "MOB";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {SESSION_TYPES.map((t) => (
          <Chip key={t} active={type === t} color={PROGRAM[t].color} onClick={() => setType(t)}>
            {t === "JOG" ? "Jog" : t === "BJJ" ? "BJJ" : t === "MOB" ? "Mobility" : `Session ${t}`}
          </Chip>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, textTransform: "uppercase", letterSpacing: "0.03em", color: PROGRAM[type].color }}>
              {PROGRAM[type].name}
            </div>
            {isLift && type !== "MOB" && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>RPE 7–8 · leave 1–3 reps in the tank · 3 min rest on main lifts</div>}
            {type === "MOB" && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Nothing painful, nothing forced · breathe into end range · log seconds or reps · ~30–40 min</div>}
            {type === "JOG" && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Zone 2 · ~109–127 bpm · conversational pace · 30–40 min</div>}
            {type === "BJJ" && <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>Log how hard the session was so the week's load is visible</div>}
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: "6px 8px", fontSize: 16, fontFamily: "inherit" }} />
        </div>
      </Card>

      {(PROGRAM[type].warmup || []).length > 0 && (
        <WarmupCard items={PROGRAM[type].warmup} color={PROGRAM[type].color} />
      )}

      {isLift && exercises.map((ex) => (
        <Card key={ex.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
            <div style={{ fontSize: 11, color: C.dim }}>{ex.scheme}</div>
          </div>
          {lastPerf[ex.name] && (
            <div style={{ fontSize: 12, color: C.gold, marginBottom: 8 }}>
              Last top set: {lastPerf[ex.name].kg || 0}kg × {lastPerf[ex.name].reps}
              {lastPerf[ex.name].rpe ? ` @ RPE ${lastPerf[ex.name].rpe}` : ""} — beat it by a rep, then add load
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, paddingLeft: 28 }}>
              <div style={{ width: 64, textAlign: "center" }}>kg</div>
              <div style={{ width: 64, textAlign: "center" }}>reps / s</div>
              <div style={{ width: 64, textAlign: "center" }}>RPE</div>
            </div>
            {ex.sets.map((st, i) => (
              <div key={st.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 20, fontSize: 12, color: C.dim, fontWeight: 700 }}>{i + 1}</div>
                <NumInput value={st.kg} onChange={(v) => updateSet(ex.id, st.id, "kg", v)} placeholder="0" />
                <NumInput value={st.reps} onChange={(v) => updateSet(ex.id, st.id, "reps", v)} placeholder="—" />
                <NumInput value={st.rpe} onChange={(v) => updateSet(ex.id, st.id, "rpe", v)} placeholder="—" />
                {ex.sets.length > 1 && (
                  <button onClick={() => removeSet(ex.id, st.id)} style={{ background: "transparent", border: "none", color: C.dim, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => addSet(ex.id)} style={{ marginTop: 10, background: "transparent", border: `1px dashed ${C.line}`, borderRadius: 8, color: C.dim, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            + Add set
          </button>
        </Card>
      ))}

      <Card>
        <Label>Session RPE (how hard was the whole session?)</Label>
        <Scale10 value={sessionRPE} onChange={setSessionRPE} />
        <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "flex-end" }}>
          <div>
            <Label>Duration</Label>
            <NumInput value={minutes} onChange={setMinutes} placeholder="65" suffix="min" width={72} />
          </div>
          {sessionRPE && minutes && (
            <div style={{ fontSize: 13, color: C.dim, paddingBottom: 8 }}>
              Session load: <strong style={{ color: C.text }}>{sessionRPE * parseFloat(minutes || 0)}</strong>
            </div>
          )}
        </div>
        <div style={{ marginTop: 14 }}>
          <Label>Notes (technique cues, how it felt)</Label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. dips felt smooth, kept ROM above parallel"
            style={{ width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.text, padding: 10, fontSize: 16, fontFamily: "inherit", resize: "vertical" }} />
        </div>
      </Card>

      <PrimaryButton onClick={save}>Log session</PrimaryButton>
    </div>
  );
}
