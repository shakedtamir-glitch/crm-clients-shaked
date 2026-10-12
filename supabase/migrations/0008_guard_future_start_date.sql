-- current_month used `greatest(1, ...)` to floor the count at 1, but a
-- client with a start_date in the future (e.g. onboarded ahead of their
-- actual start) produces a negative/zero raw value from age(), which
-- greatest() also clamps to 1 — so they'd show as "Month 1" and trigger a
-- milestone email before they've actually started. Only compute a month
-- once start_date has actually arrived.
create or replace view client_overview as
select
  c.id, c.full_name, c.email, c.phone, c.instagram, c.country, c.timezone, c.age, c.avatar_url,
  c.start_date, c.end_date, c.program_type, c.status, c.goals, c.notes,
  c.payment_amount, c.payment_currency, c.payment_frequency, c.next_payment_date,
  c.tags, c.created_by, c.created_at, c.updated_at,
  case
    when c.start_date is not null and c.start_date <= current_date then
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
    and c.end_date <= current_date + interval '14 days') as coaching_ending_soon,
  c.coach_id,
  c.last_milestone_month,
  c.completion_email_sent,
  c.last_reengagement_sent_at
from clients c;
