# Fight Camp

Minimalist strength + BJJ tracker. React + Vite, installable on an iPhone
home screen, local-first with Supabase as the durable mirror.

## The one thing that matters

Log a session on your phone, force-close Safari, reopen the home-screen app
— the session is there. No banners, no backup codes, no drama.

## How persistence works

Every save writes `localStorage` **synchronously**, and that is the write
that counts. Supabase is a background mirror, not the critical path:

- A save can never fail because of gym wifi. There is no spinner, no retry
  banner, no "unsaved data" state to manage.
- Supabase makes the data survive the thing localStorage can't: iOS Safari
  evicting script-writable storage, or the phone being lost.
- Sync reconciles on sign-in, on regaining signal, and every time the app
  comes back to the foreground.

Conflicts resolve last-write-wins per record, using an `updatedAt` stamp the
app applies by diffing state on each save. Deletes leave a tombstone so a
later pull can't resurrect them.

If Supabase isn't configured, or you tap "Skip" at sign-in, the app runs
local-only and everything still works.

## Setup

```bash
npm install
npm run dev
```

### Supabase

1. Create a project, then apply `supabase/migrations/0001_init.sql`.
2. Copy the project URL and publishable (anon) key into `.env`:

   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<publishable key>
   ```

   Both are public by design — they ship to the browser. Row Level Security
   is what protects the data: every row is scoped to `auth.uid()`, so the
   key on its own reads nothing.

3. **Auth → Email templates → Magic Link**: make sure the template includes
   `{{ .Token }}`. Supabase's default template only renders a link, and this
   app asks for the 6-digit code — on iOS a link opens in Safari rather than
   the installed home-screen app. Tapping the link still works as a fallback.

### Deploy

Vercel, framework preset Vite. Set the two `VITE_` variables above in
project settings, then redeploy so the build picks them up.

## Adding it to the iPhone home screen

Open the deployed URL in Safari → Share → Add to Home Screen. It launches
standalone (no browser chrome), works offline, and respects the safe area
around the home indicator.

## Tests

```bash
npm test
```

36 tests covering what the old `test-harness.cjs` asserted, plus the sync
layer: persistence round-trip across a simulated force-close, same-day
check-in upsert, deload trigger maths, the exact coach-review export format,
merge/tombstone behaviour, and a set of guards on the program itself.

## What must not change

`src/lib/program.js` encodes an evidence-based protocol Ryan approved — the
sessions, exercises, schemes, warm-up checklists and week plan. The deload
triggers, the double-progression hint, the check-in fields, session load
(`RPE × minutes`) and the coach-review export format are product decisions
too. `tests/logic.test.js` guards them; if a test there fails, the change is
almost certainly wrong.
