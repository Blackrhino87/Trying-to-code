-- Fight Camp — schema.
--
-- Single user, tiny dataset. Sets live as JSONB on the session rather than
-- in a child table: they are only ever read and written whole, so a join
-- would buy nothing.
--
-- A check-in is keyed by (user_id, date) because "one check-in per date"
-- is a product rule — making it the primary key means the database
-- enforces it and a same-day save can only ever update, never duplicate.

create table if not exists public.sessions (
  user_id     uuid        not null references auth.users (id) on delete cascade,
  id          text        not null,
  date        date        not null,
  type        text        not null check (type in ('A', 'B', 'C', 'MOB', 'JOG', 'BJJ')),
  name        text,
  session_rpe smallint    check (session_rpe between 1 and 10),
  minutes     text        not null default '',
  notes       text        not null default '',
  exercises   jsonb       not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists sessions_user_date_idx on public.sessions (user_id, date);

create table if not exists public.checkins (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  date       date        not null,
  id         text        not null,
  sleep_h    text        not null default '',
  sleep_q    smallint    check (sleep_q between 1 and 10),
  energy     smallint    check (energy between 1 and 10),
  -- Dead-hang SECONDS. The artifact-era app stored this in a field called
  -- `gripKg`; the client migrates the old name on load.
  hang_sec   text        not null default '',
  niggles    jsonb       not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Row Level Security is the only thing standing between the publishable
-- key (which ships to the browser) and the data. Every row is owned.
alter table public.sessions enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "own sessions" on public.sessions;
create policy "own sessions" on public.sessions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own checkins" on public.checkins;
create policy "own checkins" on public.checkins
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
