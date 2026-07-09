# Calisthenics Coaching CRM

A Fireberry-inspired CRM built for an online calisthenics coaching business. Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (DB, Auth, Storage).

## Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`, light/dark themes)
- Supabase: Postgres + Row Level Security, Auth (email/password), Storage (attachments)
- Recharts for dashboard charts, `@dnd-kit` for the leads kanban board

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project at [supabase.com](https://supabase.com).
3. Run the schema migration: open the SQL Editor in your Supabase project and run the full contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). This creates all tables, RLS policies, the `client_overview` computed view, and the `attachments` storage bucket.
4. Copy `.env.local.example` to `.env.local` and fill in your project's URL/keys (Supabase → Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000), you'll land on `/login`. Click "Create one" to sign up — the first account you create becomes a `coach` role in `profiles` (promote to `admin` manually in the Supabase table editor if needed).

## What's built (Phase 1 — MVP core)

- **Auth**: email/password sign up & sign in, session refresh via `src/proxy.ts` (Next 16 renamed Middleware → Proxy), route protection.
- **Dashboard**: active clients, leads, new leads/mo, revenue (mo/yr), MRR, payment due/overdue, coaching ending soon, conversion rate, 4 charts (revenue, new clients, lead conversion, retention), recent activity feed, upcoming reminders.
- **Clients**: searchable/filterable list, full profile with tabs — Overview, Payments (history + outstanding balance), Progress (weekly check-ins), Communication log, Attachments (Supabase Storage), Notes & Activity timeline.
- **Leads**: 7-stage kanban pipeline with drag-and-drop (`@dnd-kit`), lead → client conversion, activity logging.
- Global search (clients + leads), light/dark theme toggle, responsive layout with mobile nav drawer.

## Not yet built (stubbed nav entries)

Revenue/Finance, Calendar, Tasks, Analytics, Settings/Admin, and email automation (Resend) are placeholder pages — see `AGENTS.md`/conversation history for the full spec. Build these incrementally; do not rebuild what exists above.

## Database

All schema changes go through a new file in `supabase/migrations/`. Keep `src/lib/supabase/types.ts` in sync — see the note at the top of that file about why row types are `type` aliases, not `interface`s (TypeScript's implicit index-signature rule, required for `@supabase/supabase-js`'s generic `Database` constraint).

## Deploy

Deploy to Vercel as a standard Next.js app; set the same environment variables in the Vercel project settings.
