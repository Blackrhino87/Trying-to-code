import { useState, useEffect, useRef, useCallback } from "react";
import { loadLocal, saveLocal, stampChanges } from "./storage.js";
import { mergeData } from "./sync.js";
import { pullAll, pushAll } from "./remote.js";

const clockTime = () =>
  new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

/* ------------------------------------------------------------------
   Local-first persistence.

   Every save writes localStorage synchronously — that is the write that
   matters, and it cannot fail because of gym wifi. Supabase is a mirror
   that catches up in the background and makes the data survive Safari
   evicting its storage. Nothing in the UI ever blocks on the network.
   ------------------------------------------------------------------ */
export function useTrackerData({ client, userId }) {
  const [data, setData] = useState(loadLocal);
  const [sync, setSync] = useState({ state: "idle", at: null });

  const dataRef = useRef(data);
  const timer = useRef(null);
  const pushing = useRef(false);
  const again = useRef(false);

  const commit = useCallback((next) => {
    dataRef.current = next;
    setData(next);
    saveLocal(next);
  }, []);

  /** Upload the current snapshot. Safe to call concurrently — it queues. */
  const push = useCallback(async () => {
    if (!client || !userId) return;
    if (pushing.current) {
      again.current = true;
      return;
    }
    pushing.current = true;
    setSync((s) => ({ ...s, state: "syncing" }));
    try {
      const applied = await pushAll(client, userId, dataRef.current);
      if (applied.length) {
        const done = new Set(applied.map((t) => t.kind + ":" + t.key));
        const cur = dataRef.current;
        commit({
          ...cur,
          tombstones: cur.tombstones.filter((t) => !done.has(t.kind + ":" + t.key)),
        });
      }
      setSync({ state: "ok", at: clockTime() });
    } catch {
      setSync({ state: "offline", at: null });
    } finally {
      pushing.current = false;
      if (again.current) {
        again.current = false;
        push();
      }
    }
  }, [client, userId, commit]);

  const schedulePush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(push, 800);
  }, [push]);

  /** Pull, merge, then push anything the server is missing. */
  const syncNow = useCallback(async () => {
    if (!client || !userId) return;
    setSync((s) => ({ ...s, state: "syncing" }));
    try {
      const remote = await pullAll(client, userId);
      commit(mergeData(dataRef.current, remote));
    } catch {
      setSync({ state: "offline", at: null });
      return;
    }
    await push();
  }, [client, userId, commit, push]);

  /** The single write path used by every tab. */
  const persist = useCallback(
    async (next) => {
      commit(stampChanges(dataRef.current, next));
      schedulePush();
      return true;
    },
    [commit, schedulePush]
  );

  // Reconcile on sign-in, on regaining signal, and each time the app is
  // brought back to the foreground (re-opening from the home screen).
  useEffect(() => {
    if (!client || !userId) return;
    let live = true;
    const run = () => {
      if (live) syncNow();
    };
    run();

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
      else if (timer.current) {
        clearTimeout(timer.current);
        push();
      }
    };
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [client, userId, syncNow, push]);

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  return { data, persist, sync, syncNow };
}
