-- `client_overview` was created in 0001 with `select c.*, ...`, which freezes
-- the column list at creation time — it does NOT pick up columns added to
-- `clients` by later migrations (`coach_id`, `last_milestone_month` in 0004;
-- `completion_email_sent`, `last_reengagement_sent_at` in 0005).
--
-- Practical effect: every app query reads those columns as always-null from
-- this view, so the automations that gate on them never see a real value:
--   * runMilestoneCheck's `last_milestone_month` dedup never holds, so the
--     "entered Month N" email would re-send on every cron run, not once per
--     month transition.
--   * runLifecycleAutomations' `last_reengagement_sent_at` cooldown never
--     holds, so the 30-day re-engagement email would re-send daily once a
--     client crosses the inactivity threshold.
--
-- Fix: explicitly list the original columns in their original position (so
-- `create or replace view` accepts it — Postgres only allows replacing a
-- view when existing output columns keep the same name/type/order), then
-- append the newer columns at the end.
create or replace view client_overview as
select
  c.id, c.full_name, c.email, c.phone, c.instagram, c.country, c.timezone, c.age, c.avatar_url,
  c.start_date, c.end_date, c.program_type, c.status, c.goals, c.notes,
  c.payment_amount, c.payment_currency, c.payment_frequency, c.next_payment_date,
  c.tags, c.created_by, c.created_at, c.updated_at,
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
    and c.end_date <= current_date + interval '14 days') as coaching_ending_soon,
  c.coach_id,
  c.last_milestone_month,
  c.completion_email_sent,
  c.last_reengagement_sent_at
from clients c;
