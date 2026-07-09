-- Coaching CRM — initial schema
-- Run this in the Supabase SQL editor (or `supabase db push`) against a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'coach' check (role in ('admin', 'coach')),
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'coach')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),

  -- personal information
  full_name text not null,
  email text,
  phone text,
  instagram text,
  country text,
  timezone text,
  age int,
  avatar_url text,

  -- coaching information
  start_date date,
  end_date date,
  program_type text,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  goals text,
  notes text,

  -- payment defaults (drive recurring reminders; history lives in `payments`)
  payment_amount numeric(10, 2),
  payment_currency text not null default 'USD',
  payment_frequency text check (payment_frequency in ('weekly', 'monthly', 'quarterly', 'yearly', 'one_time')),
  next_payment_date date,

  tags text[] not null default '{}',

  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row execute procedure set_updated_at();

create index if not exists clients_status_idx on clients (status);
create index if not exists clients_next_payment_idx on clients (next_payment_date);
create index if not exists clients_end_date_idx on clients (end_date);
create index if not exists clients_tags_idx on clients using gin (tags);

-- ---------------------------------------------------------------------------
-- payments (history) + invoices
-- ---------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('paid', 'pending', 'overdue', 'refunded')),
  method text check (method in ('card', 'paypal', 'bank_transfer', 'crypto', 'other')),
  due_date date,
  paid_date date,
  invoice_number text,
  notes text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payments_client_idx on payments (client_id);
create index if not exists payments_status_idx on payments (status);
create index if not exists payments_due_date_idx on payments (due_date);

-- ---------------------------------------------------------------------------
-- client notes
-- ---------------------------------------------------------------------------
create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists client_notes_client_idx on client_notes (client_id);

-- ---------------------------------------------------------------------------
-- weekly check-ins / progress
-- ---------------------------------------------------------------------------
create table if not exists client_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  week_of date not null default current_date,
  skills text[] not null default '{}',
  goals_progress text,
  video_urls text[] not null default '{}',
  notes text,
  coach_feedback text,
  created_at timestamptz not null default now()
);

create index if not exists client_checkins_client_idx on client_checkins (client_id);

-- ---------------------------------------------------------------------------
-- attachments (metadata; binary lives in Supabase Storage)
-- ---------------------------------------------------------------------------
create table if not exists client_attachments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('pdf', 'video', 'image', 'document')),
  size_bytes bigint,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists client_attachments_client_idx on client_attachments (client_id);

-- ---------------------------------------------------------------------------
-- communication log (emails / messages / calls)
-- ---------------------------------------------------------------------------
create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  type text not null check (type in ('email', 'message', 'call')),
  direction text not null default 'outbound' check (direction in ('inbound', 'outbound')),
  subject text,
  body text,
  occurred_at timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists communications_client_idx on communications (client_id);

-- ---------------------------------------------------------------------------
-- leads (pipeline)
-- ---------------------------------------------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  instagram text,
  email text,
  phone text,
  country text,
  source text,
  notes text,
  stage text not null default 'new' check (
    stage in ('new', 'contacted', 'discovery_call', 'interested', 'follow_up', 'closed_won', 'closed_lost')
  ),
  estimated_value numeric(10, 2),
  last_contact date,
  next_follow_up date,
  assigned_to uuid references profiles (id) on delete set null,
  converted_client_id uuid references clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
  before update on leads
  for each row execute procedure set_updated_at();

create index if not exists leads_stage_idx on leads (stage);
create index if not exists leads_created_at_idx on leads (created_at);

-- ---------------------------------------------------------------------------
-- activity timeline (polymorphic log — powers "recent activity" + automation)
-- ---------------------------------------------------------------------------
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client', 'lead', 'payment', 'task')),
  entity_id uuid not null,
  type text not null,
  description text not null,
  actor_id uuid references profiles (id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists activities_entity_idx on activities (entity_type, entity_id);
create index if not exists activities_created_at_idx on activities (created_at desc);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  reminder_at timestamptz,
  client_id uuid references clients (id) on delete set null,
  lead_id uuid references leads (id) on delete set null,
  assigned_to uuid references profiles (id) on delete set null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on tasks (due_date);
create index if not exists tasks_completed_idx on tasks (completed);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications (user_id, is_read);

-- ---------------------------------------------------------------------------
-- computed views (automation: current coaching month, payment/coaching alerts)
-- ---------------------------------------------------------------------------
create or replace view client_overview as
select
  c.*,
  case
    when c.start_date is not null then
      greatest(
        1,
        (date_part('year', age(current_date, c.start_date)) * 12
          + date_part('month', age(current_date, c.start_date)) + 1)::int
      )
  end as current_month,
  (c.next_payment_date is not null and c.next_payment_date < current_date) as payment_overdue,
  (c.next_payment_date is not null
    and c.next_payment_date >= current_date
    and c.next_payment_date <= current_date + interval '7 days') as payment_due_soon,
  (c.end_date is not null
    and c.end_date >= current_date
    and c.end_date <= current_date + interval '14 days') as coaching_ending_soon
from clients c;

-- ---------------------------------------------------------------------------
-- storage bucket for attachments
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Single-tenant internal CRM: any authenticated team member (a row in
-- `profiles`) has full read/write access. Tighten per-role if you add
-- multiple coaches with restricted data later.
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table client_notes enable row level security;
alter table client_checkins enable row level security;
alter table client_attachments enable row level security;
alter table communications enable row level security;
alter table leads enable row level security;
alter table activities enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;

create policy "profiles: read own team" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles: update self" on profiles for update using (id = auth.uid());

create policy "clients: team access" on clients for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "payments: team access" on payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "client_notes: team access" on client_notes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "client_checkins: team access" on client_checkins for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "client_attachments: team access" on client_attachments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "communications: team access" on communications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "leads: team access" on leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "activities: team access" on activities for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "tasks: team access" on tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "notifications: own only" on notifications for select using (user_id = auth.uid());
create policy "notifications: own update" on notifications for update using (user_id = auth.uid());
create policy "notifications: team insert" on notifications for insert with check (auth.role() = 'authenticated');

create policy "attachments bucket: team access"
  on storage.objects for all
  using (bucket_id = 'attachments' and auth.role() = 'authenticated')
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
