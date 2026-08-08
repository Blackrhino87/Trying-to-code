import {
  toSessionRow,
  fromSessionRow,
  toCheckinRow,
  fromCheckinRow,
} from "./sync.js";

const chunk = (arr, n = 500) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

/** Full snapshot from Supabase. Throws if the network or RLS says no. */
export async function pullAll(client, userId) {
  const [s, c] = await Promise.all([
    client.from("sessions").select("*").eq("user_id", userId),
    client.from("checkins").select("*").eq("user_id", userId),
  ]);
  if (s.error) throw s.error;
  if (c.error) throw c.error;
  return {
    sessions: (s.data || []).map(fromSessionRow),
    checkins: (c.data || []).map(fromCheckinRow),
    tombstones: [],
  };
}

/**
 * Push the local snapshot up: upsert everything, then action the
 * tombstones. Returns the tombstones that were successfully applied so
 * the caller can drop them.
 */
export async function pushAll(client, userId, data) {
  for (const rows of chunk(data.sessions.map((s) => toSessionRow(userId, s)))) {
    const { error } = await client
      .from("sessions")
      .upsert(rows, { onConflict: "user_id,id" });
    if (error) throw error;
  }
  for (const rows of chunk(data.checkins.map((c) => toCheckinRow(userId, c)))) {
    const { error } = await client
      .from("checkins")
      .upsert(rows, { onConflict: "user_id,date" });
    if (error) throw error;
  }

  const deadSessions = data.tombstones.filter((t) => t.kind === "session").map((t) => t.key);
  const deadCheckins = data.tombstones.filter((t) => t.kind === "checkin").map((t) => t.key);

  for (const ids of chunk(deadSessions)) {
    const { error } = await client.from("sessions").delete().eq("user_id", userId).in("id", ids);
    if (error) throw error;
  }
  for (const dates of chunk(deadCheckins)) {
    const { error } = await client.from("checkins").delete().eq("user_id", userId).in("date", dates);
    if (error) throw error;
  }

  return data.tombstones;
}
