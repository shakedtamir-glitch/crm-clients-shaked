-- 0005 only granted SELECT on email_log, so every insert was silently
-- rejected by RLS's default-deny (the email itself still sent via Resend —
-- only the log write failed).
create policy "email_log: team insert" on email_log for insert with check (auth.role() = 'authenticated');
