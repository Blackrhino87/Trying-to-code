import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, BarChart, Bar,
} from "recharts";
import { C } from "../lib/program.js";
import { fmtDate, mondayOf } from "../lib/format.js";
import { Card, Chip, Label } from "../components/ui.jsx";

export default function ProgressTab({ data }) {
  const exerciseNames = useMemo(() => {
    const s = new Set();
    data.sessions.forEach((ss) => (ss.exercises || []).forEach((e) => s.add(e.name)));
    return [...s];
  }, [data.sessions]);

  const [selEx, setSelEx] = useState(null);
  const ex = selEx || exerciseNames[0];

  const liftSeries = useMemo(() => {
    if (!ex) return [];
    return [...data.sessions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => {
        const found = (s.exercises || []).find((e) => e.name === ex);
        if (!found) return null;
        const top = (found.sets || []).reduce(
          (best, st) => ((parseFloat(st.kg) || 0) > (parseFloat(best?.kg) || -1) ? st : best),
          null
        );
        return top
          ? { date: fmtDate(s.date), kg: parseFloat(top.kg) || 0, reps: parseFloat(top.reps) || 0 }
          : null;
      })
      .filter(Boolean);
  }, [data.sessions, ex]);

  const checkSeries = useMemo(
    () =>
      [...data.checkins]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((c) => ({
          date: fmtDate(c.date),
          hang: parseFloat(c.hangSec) || null,
          sleep: parseFloat(c.sleepH) || null,
          niggle: (c.niggles || []).reduce((m, n) => Math.max(m, n.score), 0) || 0,
        })),
    [data.checkins]
  );

  const weekLoad = useMemo(() => {
    const byWeek = {};
    data.sessions.forEach((s) => {
      const key = mondayOf(new Date(s.date + "T00:00:00"));
      const load = (s.sessionRPE || 0) * (parseFloat(s.minutes) || 0);
      byWeek[key] = (byWeek[key] || 0) + load;
    });
    return Object.entries(byWeek)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => ({ week: fmtDate(k), load: v }));
  }, [data.sessions]);

  const total = data.sessions.length;
  const empty = total === 0 && data.checkins.length === 0;
  const thisMonday = mondayOf(new Date());

  const tt = {
    contentStyle: { background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: C.dim },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {empty && (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 22, textTransform: "uppercase" }}>Nothing logged yet</div>
          <div style={{ color: C.dim, fontSize: 14, marginTop: 6 }}>Log a session or a check-in and your charts build themselves here.</div>
        </Card>
      )}

      {total > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          {[
            ["Sessions", total],
            ["This week", data.sessions.filter((s) => s.date >= thisMonday).length],
            ["Check-ins", data.checkins.length],
          ].map(([l, v]) => (
            <Card key={l} style={{ flex: 1, textAlign: "center", padding: 12 }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, color: C.gold }}>{v}</div>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div>
            </Card>
          ))}
        </div>
      )}

      {exerciseNames.length > 0 && (
        <Card>
          <Label>Top set progression</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {exerciseNames.map((n) => <Chip key={n} active={ex === n} onClick={() => setSelEx(n)}>{n}</Chip>)}
          </div>
          {liftSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={liftSeries}>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={C.dim} fontSize={11} />
                <YAxis stroke={C.dim} fontSize={11} width={34} />
                <Tooltip {...tt} />
                <Line type="monotone" dataKey="kg" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} name="Top set (kg)" />
                <Line type="monotone" dataKey="reps" stroke={C.blue} strokeWidth={1.5} dot={false} name="Reps" />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ color: C.dim, fontSize: 13 }}>No logged sets for this lift yet.</div>}
        </Card>
      )}

      {checkSeries.length > 1 && (
        <Card>
          <Label>Readiness — dead hang (s) &amp; worst niggle</Label>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={checkSeries}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={C.dim} fontSize={11} />
              <YAxis stroke={C.dim} fontSize={11} width={34} />
              <Tooltip {...tt} />
              <ReferenceLine y={6} stroke={C.red} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="hang" stroke={C.green} strokeWidth={2.5} dot={{ r: 3, fill: C.green }} name="Dead hang (s)" connectNulls />
              <Line type="monotone" dataKey="niggle" stroke={C.red} strokeWidth={2} dot={{ r: 3, fill: C.red }} name="Worst niggle" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: C.dim }}>Red dashed line = niggle deload threshold (6/10)</div>
        </Card>
      )}

      {weekLoad.length > 0 && (
        <Card>
          <Label>Weekly training load (session RPE × minutes)</Label>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekLoad}>
              <CartesianGrid stroke={C.line} strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke={C.dim} fontSize={11} />
              <YAxis stroke={C.dim} fontSize={11} width={40} />
              <Tooltip {...tt} />
              <Bar dataKey="load" fill={C.gold} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 11, color: C.dim }}>Big week-to-week spikes (&gt;30%) are how niggles start — build gradually.</div>
        </Card>
      )}
    </div>
  );
}
