-- Calendar module — manual events (client calls, discovery calls, weekly
-- check-in reminders, etc). Payment due dates, coaching-ending dates, and
-- lead follow-ups are derived from existing tables at query time, not stored
-- here.

create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'other' check (
    type in ('client_call', 'discovery_call', 'check_in', 'follow_up', 'other')
  ),
  client_id uuid references clients (id) on delete cascade,
  lead_id uuid references leads (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_starts_at_idx on calendar_events (starts_at);
create index if not exists calendar_events_client_idx on calendar_events (client_id);
create index if not exists calendar_events_lead_idx on calendar_events (lead_id);

alter table calendar_events enable row level security;

create policy "calendar_events: team access" on calendar_events
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
