-- Allow admins to update any team member's profile (e.g. change role),
-- in addition to the existing "users can update their own profile" policy.
-- Postgres combines multiple USING policies for the same command with OR.

create policy "profiles: admin can update any" on profiles
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
