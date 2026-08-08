import React, { useState } from "react";
import { C } from "../lib/program.js";

const LAST_EMAIL = "fight-camp-email";

/* Single-user gate. Supabase emails a 6-digit code; tapping the link in
   the same email also works (Safari handles it), which matters because
   iOS opens mail links outside the installed home-screen app. */
export default function Auth({ client, onSkip }) {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(LAST_EMAIL) || ""; } catch { return ""; }
  });
  const [stage, setStage] = useState("email");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const send = async () => {
    const addr = email.trim();
    if (!addr) return;
    setBusy(true); setErr(null);
    const { error } = await client.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    try { localStorage.setItem(LAST_EMAIL, addr); } catch { /* private mode */ }
    setStage("code");
  };

  const verify = async () => {
    const token = code.trim();
    if (!token) return;
    setBusy(true); setErr(null);
    const { error } = await client.auth.verifyOtp({ email: email.trim(), token, type: "email" });
    setBusy(false);
    if (error) setErr(error.message);
    // success flips the session listener in App
  };

  const field = {
    width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 10,
    color: C.text, padding: "13px 14px", fontSize: 16, fontFamily: "inherit",
  };
  const button = {
    width: "100%", marginTop: 12, background: C.gold, color: C.ink, border: "none", borderRadius: 12,
    padding: "15px 0", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 19,
    letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", opacity: busy ? 0.6 : 1,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.ink, color: C.text, fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <h1 style={{ margin: "0 0 6px", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 40, letterSpacing: "0.03em", textTransform: "uppercase", textAlign: "center" }}>
          Fight <span style={{ color: C.gold }}>Camp</span>
        </h1>
        <div style={{ color: C.dim, fontSize: 13, textAlign: "center", marginBottom: 26 }}>
          {stage === "email" ? "Sign in to keep your training backed up." : `We emailed a code to ${email.trim()}.`}
        </div>

        {stage === "email" ? (
          <>
            <input
              type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off"
              value={email} placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={field}
            />
            <button onClick={send} disabled={busy} style={button}>
              {busy ? "Sending…" : "Email me a code"}
            </button>
          </>
        ) : (
          <>
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
              value={code} placeholder="123456"
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              style={{ ...field, textAlign: "center", letterSpacing: "0.35em", fontSize: 22, fontWeight: 700 }}
            />
            <button onClick={verify} disabled={busy} style={button}>
              {busy ? "Checking…" : "Sign in"}
            </button>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 12, textAlign: "center", lineHeight: 1.6 }}>
              No code in the email? Tap the sign-in link in it instead.
              <br />
              <button onClick={() => { setStage("email"); setCode(""); setErr(null); }}
                style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontFamily: "inherit", fontSize: 12, padding: "6px 0", textDecoration: "underline" }}>
                Use a different email
              </button>
            </div>
          </>
        )}

        {err && <div style={{ color: C.red, fontSize: 13, marginTop: 12, textAlign: "center" }}>{err}</div>}

        <button onClick={onSkip} style={{ display: "block", margin: "24px auto 0", background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>
          Skip — log to this phone only
        </button>
      </div>
    </div>
  );
}
