import React, { useState, useEffect, useCallback } from "react";
import { supabase, isConfigured } from "./lib/supabase.js";
import { C } from "./lib/program.js";
import FightCamp from "./components/FightCamp.jsx";
import Auth from "./components/Auth.jsx";

const OFFLINE_FLAG = "fight-camp-local-only";

export default function App() {
  const [session, setSession] = useState(isConfigured ? undefined : null);
  const [localOnly, setLocalOnly] = useState(() => {
    try { return localStorage.getItem(OFFLINE_FLAG) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try { localStorage.removeItem(OFFLINE_FLAG); } catch { /* private mode */ }
    setLocalOnly(false);
    if (supabase) await supabase.auth.signOut();
  }, []);

  const skip = useCallback(() => {
    try { localStorage.setItem(OFFLINE_FLAG, "1"); } catch { /* private mode */ }
    setLocalOnly(true);
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading your camp…
      </div>
    );
  }

  const account = session?.user
    ? { id: session.user.id, email: session.user.email, signOut }
    : null;

  if (account || localOnly || !isConfigured) {
    return <FightCamp client={supabase} account={account} />;
  }
  return <Auth client={supabase} onSkip={skip} />;
}
