import React, { useState, Suspense, lazy } from "react";
import { C } from "../lib/program.js";
import { computeReadiness } from "../lib/deload.js";
import { useTrackerData } from "../lib/useTrackerData.js";
import WeekStrip from "./WeekStrip.jsx";
import TrainTab from "../tabs/TrainTab.jsx";
import CheckinTab from "../tabs/CheckinTab.jsx";
import ProgramTab from "../tabs/ProgramTab.jsx";

/* The charts pull in Recharts — about two thirds of the bundle. Splitting
   it out keeps the Train tab, the one opened mid-session, fast to load. */
const ProgressTab = lazy(() => import("../tabs/ProgressTab.jsx"));

const SYNC_COPY = {
  syncing: "Syncing…",
  ok: (at) => `Backed up · ${at}`,
  offline: "Saved on this phone · will back up when you're online",
  idle: null,
};

export default function FightCamp({ client, account }) {
  const { data, persist, sync } = useTrackerData({ client, userId: account?.id });
  const [tab, setTab] = useState("train");

  const { hangAlert, niggleAlert } = computeReadiness(data.checkins);
  const syncLine =
    sync.state === "ok" ? SYNC_COPY.ok(sync.at) : SYNC_COPY[sync.state] || null;

  return (
    <div style={{ minHeight: "100vh", background: C.ink, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: "calc(90px + env(safe-area-inset-bottom))" }}>
      <header style={{ padding: "max(20px, env(safe-area-inset-top)) 16px 12px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Fight <span style={{ color: C.gold }}>Camp</span>
          </h1>
          <div style={{ fontSize: 12, color: C.dim }}>
            {new Date().toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>

        <WeekStrip sessions={data.sessions} />

        {syncLine && (
          <div style={{ marginTop: 8, fontSize: 11, color: C.dim, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: 3, display: "inline-block",
              background: sync.state === "ok" ? C.green : sync.state === "offline" ? C.dim : C.gold,
            }} />
            {syncLine}
          </div>
        )}

        {(hangAlert || niggleAlert) && (
          <div style={{ marginTop: 10, background: "#2A1A16", border: `1px solid ${C.red}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0B8AD" }}>
            <strong style={{ color: C.red }}>Deload signal:</strong>{" "}
            {hangAlert && "dead hang is down >10% vs your recent baseline. "}
            {niggleAlert && "a niggle is scoring ≥6/10. "}
            Cut volume ~50% and keep it crisp — or swap your next lift for a Mobility day.
          </div>
        )}
      </header>

      <main style={{ padding: 16, maxWidth: 640, margin: "0 auto" }}>
        {tab === "train" && <TrainTab data={data} persist={persist} />}
        {tab === "checkin" && <CheckinTab data={data} persist={persist} />}
        {tab === "progress" && (
          <Suspense fallback={<div style={{ color: C.dim, fontSize: 13 }}>Drawing your charts…</div>}>
            <ProgressTab data={data} />
          </Suspense>
        )}
        {tab === "program" && <ProgramTab data={data} persist={persist} account={account} />}
      </main>

      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: C.panel,
        borderTop: `1px solid ${C.line}`, display: "flex", zIndex: 10,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {[["train", "Train"], ["checkin", "Check-in"], ["progress", "Progress"], ["program", "Program"]].map(([key, lab]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: "14px 0 18px", background: "transparent", border: "none", cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.06em", textTransform: "uppercase",
            color: tab === key ? C.gold : C.dim,
            borderTop: `2px solid ${tab === key ? C.gold : "transparent"}`, marginTop: -1,
          }}>{lab}</button>
        ))}
      </nav>
    </div>
  );
}
