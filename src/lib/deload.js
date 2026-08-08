/* ------------------------------------------------------------------
   Deload triggers — a product decision, not a heuristic to tune.

   Fires when EITHER:
     - the latest dead hang is down more than 10% against the mean of
       the previous 7 check-ins that recorded a hang, OR
     - any niggle on the latest check-in scores 6/10 or worse.
   ------------------------------------------------------------------ */

export function computeReadiness(checkins = []) {
  const recent = [...checkins].sort((a, b) => b.date.localeCompare(a.date));
  const latest = recent[0] || null;

  const vals = recent
    .slice(1, 8)
    .map((c) => parseFloat(c.hangSec))
    .filter((v) => v > 0);
  const baseline = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const latestHang = latest ? parseFloat(latest.hangSec) : NaN;
  const hangAlert = Boolean(
    latest && baseline && latestHang > 0 && latestHang < baseline * 0.9
  );
  const niggleAlert = Boolean(
    latest && (latest.niggles || []).some((n) => n.score >= 6)
  );

  return { latest, baseline, hangAlert, niggleAlert, alert: hangAlert || niggleAlert };
}
