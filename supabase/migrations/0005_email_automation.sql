-- Email automation engine: editable templates with {{variable}} placeholders,
-- a send log for history/idempotency, and the flags background jobs use to
-- avoid re-sending the same event twice.

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  subject text not null,
  body_html text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists email_templates_set_updated_at on email_templates;
create trigger email_templates_set_updated_at
  before update on email_templates
  for each row execute procedure set_updated_at();

create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients (id) on delete cascade,
  template_key text not null,
  subject text not null,
  status text not null default 'sent' check (status in ('sent', 'skipped', 'failed')),
  sent_at timestamptz not null default now()
);

create index if not exists email_log_client_idx on email_log (client_id);

alter table payments add column if not exists due_reminder_sent boolean not null default false;
alter table payments add column if not exists overdue_reminder_sent boolean not null default false;
alter table payments add column if not exists thank_you_sent boolean not null default false;

alter table clients add column if not exists completion_email_sent boolean not null default false;
alter table clients add column if not exists last_reengagement_sent_at timestamptz;

alter table email_templates enable row level security;
alter table email_log enable row level security;

create policy "email_templates: team read" on email_templates for select using (auth.role() = 'authenticated');
create policy "email_templates: admin write" on email_templates
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "email_log: team read" on email_log for select using (auth.role() = 'authenticated');

insert into email_templates (key, name, subject, body_html) values
(
  'welcome',
  'Welcome email',
  'Welcome to the team, {{ClientName}}!',
  '<p>Hi {{ClientName}},</p><p>Welcome aboard! I''m excited to start your {{Program}} journey with you.</p><p>Your coach is {{CoachName}} — expect your first weekly check-in soon.</p><p>Talk soon,<br>{{CoachName}}</p>'
),
(
  'onboarding',
  'Onboarding instructions',
  'Getting started with your {{Program}} coaching',
  '<p>Hi {{ClientName}},</p><p>Here''s everything you need to get started with {{Program}}:</p><ul><li>Fill out your first weekly check-in</li><li>Upload a baseline progress video</li><li>Review your goals with {{CoachName}}</li></ul>'
),
(
  'milestone',
  'Monthly coaching milestone',
  '{{ClientName}} has just entered {{CurrentMonth}} of coaching',
  '<p>{{ClientName}} has just entered {{CurrentMonth}} of coaching.</p><table><tr><td>Client Name</td><td>{{ClientName}}</td></tr><tr><td>Current Coaching Month</td><td>{{CurrentMonth}}</td></tr><tr><td>Program</td><td>{{Program}}</td></tr></table>'
),
(
  'payment_reminder',
  'Upcoming payment reminder',
  'Reminder: your next payment is coming up',
  '<p>Hi {{ClientName}},</p><p>Just a reminder that your next payment of {{PaymentAmount}} is due on {{NextPaymentDate}}.</p><p>Thanks,<br>{{CoachName}}</p>'
),
(
  'payment_overdue',
  'Overdue payment notice',
  'Your payment is now overdue',
  '<p>Hi {{ClientName}},</p><p>Your payment of {{PaymentAmount}} was due on {{NextPaymentDate}} and hasn''t come through yet. Please reach out if there''s an issue.</p><p>{{CoachName}}</p>'
),
(
  'payment_thank_you',
  'Thank you after payment',
  'Payment received — thank you!',
  '<p>Hi {{ClientName}},</p><p>Thanks for your payment of {{PaymentAmount}}! You''re all set for the next stretch of your {{Program}} coaching.</p><p>{{CoachName}}</p>'
),
(
  'contract_reminder',
  'Contract reminder',
  'A quick reminder about your coaching agreement',
  '<p>Hi {{ClientName}},</p><p>This is a reminder regarding your {{Program}} coaching agreement. Let {{CoachName}} know if you have any questions.</p>'
),
(
  'coaching_completion',
  'Coaching completion',
  'Congrats on completing your coaching program!',
  '<p>Hi {{ClientName}},</p><p>You''ve reached the end of your {{Program}} coaching journey — congratulations on all the progress you''ve made!</p><p>{{CoachName}}</p>'
),
(
  're_engagement',
  'Re-engagement',
  'We miss you — let''s get back on track',
  '<p>Hi {{ClientName}},</p><p>It''s been a while since we last checked in on your {{Program}} progress. Let''s get back on track — reply whenever you''re ready.</p><p>{{CoachName}}</p>'
),
(
  'custom',
  'Custom email',
  'A message from {{CoachName}}',
  '<p>Hi {{ClientName}},</p><p>Write your message here.</p><p>{{CoachName}}</p>'
)
on conflict (key) do nothing;
