import { normalize, sessionKey, checkinKey } from "./storage.js";

/* ------------------------------------------------------------------
   Row mapping: camelCase app state <-> snake_case Postgres.
   ------------------------------------------------------------------ */

/** Postgres hands back "…+00:00"; we generate "…Z". Canonicalise both so
    last-write-wins can compare timestamps as plain strings. */
export const isoOf = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const toSessionRow = (userId, s) => ({
  user_id: userId,
  id: s.id,
  date: s.date,
  type: s.type,
  name: s.name ?? null,
  session_rpe: s.sessionRPE ?? null,
  minutes: s.minutes ?? "",
  notes: s.notes ?? "",
  exercises: s.exercises ?? [],
  updated_at: isoOf(s.updatedAt) || new Date().toISOString(),
});

export const fromSessionRow = (r) => ({
  id: r.id,
  date: r.date,
  type: r.type,
  name: r.name ?? "",
  sessionRPE: r.session_rpe ?? null,
  minutes: r.minutes ?? "",
  notes: r.notes ?? "",
  exercises: Array.isArray(r.exercises) ? r.exercises : [],
  updatedAt: isoOf(r.updated_at),
});

export const toCheckinRow = (userId, c) => ({
  user_id: userId,
  id: c.id,
  date: c.date,
  sleep_h: c.sleepH ?? "",
  sleep_q: c.sleepQ ?? null,
  energy: c.energy ?? null,
  hang_sec: c.hangSec ?? "",
  niggles: c.niggles ?? [],
  updated_at: isoOf(c.updatedAt) || new Date().toISOString(),
});

export const fromCheckinRow = (r) => ({
  id: r.id,
  date: r.date,
  sleepH: r.sleep_h ?? "",
  sleepQ: r.sleep_q ?? null,
  energy: r.energy ?? null,
  hangSec: r.hang_sec ?? "",
  niggles: Array.isArray(r.niggles) ? r.niggles : [],
  updatedAt: isoOf(r.updated_at),
});

/* ------------------------------------------------------------------
   Merge — last write wins, tombstones veto resurrection.

   Both sides are complete snapshots. For each key we keep whichever
   copy has the newer `updatedAt`; a tombstone drops a remote record
   unless that record was edited *after* the delete.
   ------------------------------------------------------------------ */
export function mergeData(local, remote) {
  const l = normalize(local);
  const r = normalize(remote);
  const tomb = new Map(l.tombstones.map((t) => [t.kind + ":" + t.key, t.at]));

  const mergeList = (kind, keyFn, mine, theirs) => {
    const out = new Map();
    const consider = (rec) => {
      const k = keyFn(rec);
      const killedAt = tomb.get(kind + ":" + k);
      if (killedAt && !((rec.updatedAt || "") > killedAt)) return;
      const cur = out.get(k);
      if (!cur || (rec.updatedAt || "") > (cur.updatedAt || "")) out.set(k, rec);
    };
    mine.forEach(consider);
    theirs.forEach(consider);
    return [...out.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id))
    );
  };

  const sessions = mergeList("session", sessionKey, l.sessions, r.sessions);
  const checkins = mergeList("checkin", checkinKey, l.checkins, r.checkins);

  // A tombstone that a newer edit overrode has done its job — retire it.
  const alive = new Set([
    ...sessions.map((s) => "session:" + sessionKey(s)),
    ...checkins.map((c) => "checkin:" + checkinKey(c)),
  ]);
  const tombstones = l.tombstones.filter((t) => !alive.has(t.kind + ":" + t.key));

  return { sessions, checkins, tombstones };
}
