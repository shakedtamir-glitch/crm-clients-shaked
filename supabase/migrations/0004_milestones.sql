-- Client monthly milestone automation:
--   * clients.coach_id — who currently coaches this client (for filtering)
--   * clients.last_milestone_month — last coaching month a milestone was
--     fired for, so the cron job only notifies once per month transition
--   * profiles.email — denormalized from auth.users so we can email admins
--     without a service-role auth.admin call in the hot path
--   * google_calendar_connection — OAuth tokens for the connected Google
--     account (single workspace-wide connection)
--   * milestone_notifications — audit log, also guards against double-sends

alter table clients add column if not exists coach_id uuid references profiles (id) on delete set null;
update clients set coach_id = created_by where coach_id is null;
create index if not exists clients_coach_idx on clients (coach_id);

alter table clients add column if not exists last_milestone_month int;

alter table profiles add column if not exists email text;

update profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'coach')
  );
  return new;
end;
$$;

create table if not exists google_calendar_connection (
  id uuid primary key default gen_random_uuid(),
  connected_by uuid references profiles (id) on delete set null,
  connected_email text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists google_calendar_connection_set_updated_at on google_calendar_connection;
create trigger google_calendar_connection_set_updated_at
  before update on google_calendar_connection
  for each row execute procedure set_updated_at();

create table if not exists milestone_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  month int not null,
  notified_at timestamptz not null default now(),
  email_sent boolean not null default false,
  calendar_event_id text,
  unique (client_id, month)
);

create index if not exists milestone_notifications_client_idx on milestone_notifications (client_id);

alter table google_calendar_connection enable row level security;
alter table milestone_notifications enable row level security;

-- Tokens are sensitive — only admins may read the connection status via the
-- authenticated client. The cron job itself uses the service-role key and
-- bypasses RLS entirely.
create policy "google_calendar_connection: admin read" on google_calendar_connection
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "google_calendar_connection: admin write" on google_calendar_connection
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "milestone_notifications: team read" on milestone_notifications
  for select using (auth.role() = 'authenticated');
