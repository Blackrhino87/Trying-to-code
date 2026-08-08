import { nowIso } from "./format.js";

export const STORAGE_KEY = "fight-camp-v1";

export const EMPTY = { sessions: [], checkins: [], tombstones: [] };

/* Records are keyed for sync by these. A check-in is keyed by DATE, not id:
   "one check-in per date" is a product rule, so the date is the real identity. */
export const sessionKey = (s) => s.id;
export const checkinKey = (c) => c.date;

/* ------------------------------------------------------------------
   Normalisation / migration.

   The artifact-era shape stored dead-hang SECONDS in a field called
   `gripKg`. The new schema calls it `hangSec`. Old backups still load.
   ------------------------------------------------------------------ */
export function normalize(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const sessions = Array.isArray(src.sessions) ? src.sessions : [];
  const checkins = Array.isArray(src.checkins) ? src.checkins : [];
  const tombstones = Array.isArray(src.tombstones) ? src.tombstones : [];

  return {
    sessions: sessions.map((s) => ({
      ...s,
      exercises: Array.isArray(s.exercises) ? s.exercises : [],
      updatedAt: s.updatedAt || null,
    })),
    checkins: checkins.map((c) => {
      const { gripKg, ...rest } = c;
      return {
        ...rest,
        // migrate the legacy field name, keeping the value
        hangSec: c.hangSec ?? gripKg ?? "",
        niggles: Array.isArray(c.niggles) ? c.niggles : [],
        updatedAt: c.updatedAt || null,
      };
    }),
    tombstones,
  };
}

/** True when the payload looks like Fight Camp data (used by import). */
export function looksLikeTrackerData(raw) {
  return Boolean(raw && Array.isArray(raw.sessions) && Array.isArray(raw.checkins));
}

/* ------------------------------------------------------------------
   localStorage — the instant, always-available write path.
   ------------------------------------------------------------------ */
export function loadLocal(storage = safeStorage()) {
  if (!storage) return { ...EMPTY };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return normalize(JSON.parse(raw));
  } catch {
    return { ...EMPTY };
  }
}

export function saveLocal(data, storage = safeStorage()) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function safeStorage() {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------
   Change stamping.

   Every mutation goes through persist(), so rather than remembering to
   touch `updatedAt` at each call site we diff the old and new state:
   changed or new records get a fresh timestamp, removed records leave a
   tombstone so a later pull can't resurrect them.
   ------------------------------------------------------------------ */
const withoutStamp = ({ updatedAt, ...rest }) => JSON.stringify(rest);

function stampList(prevList, nextList, keyFn, at) {
  const prevByKey = new Map(prevList.map((r) => [keyFn(r), r]));
  const stamped = nextList.map((rec) => {
    const before = prevByKey.get(keyFn(rec));
    if (before && withoutStamp(before) === withoutStamp(rec)) {
      return { ...rec, updatedAt: rec.updatedAt || before.updatedAt || at };
    }
    return { ...rec, updatedAt: at };
  });

  const nextKeys = new Set(nextList.map(keyFn));
  const removed = prevList.filter((r) => !nextKeys.has(keyFn(r))).map(keyFn);
  return { stamped, removed };
}

export function stampChanges(prev, next, at = nowIso()) {
  const p = normalize(prev);
  const n = normalize(next);

  const s = stampList(p.sessions, n.sessions, sessionKey, at);
  const c = stampList(p.checkins, n.checkins, checkinKey, at);

  const revived = new Set([
    ...n.sessions.map((r) => "session:" + sessionKey(r)),
    ...n.checkins.map((r) => "checkin:" + checkinKey(r)),
  ]);

  const tombstones = [
    // keep prior tombstones, unless the record has come back
    ...p.tombstones.filter((t) => !revived.has(t.kind + ":" + t.key)),
    ...s.removed.map((key) => ({ kind: "session", key, at })),
    ...c.removed.map((key) => ({ kind: "checkin", key, at })),
  ];

  return { sessions: s.stamped, checkins: c.stamped, tombstones };
}
