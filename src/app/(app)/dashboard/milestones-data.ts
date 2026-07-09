import { addMonths, endOfMonth, isToday, isWithinInterval, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ClientOverview } from "@/lib/supabase/types";

export type MilestoneClient = {
  id: string;
  fullName: string;
  program: string | null;
  coachId: string | null;
  coachName: string | null;
  nextMonth: number;
  nextDate: string;
};

export async function getMilestonesData() {
  const supabase = await createClient();

  const [{ data: overviewRaw }, { data: coachesRaw }] = await Promise.all([
    supabase.from("client_overview").select("*").eq("status", "active"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const clients = (overviewRaw ?? []) as ClientOverview[];
  const coachMap = new Map((coachesRaw ?? []).map((c) => [c.id, c.full_name]));

  const now = new Date();
  const monthEnd = endOfMonth(now);

  const upcoming: MilestoneClient[] = clients
    .filter((c) => c.start_date && c.current_month != null)
    .map((c) => ({
      id: c.id,
      fullName: c.full_name,
      program: c.program_type,
      coachId: c.coach_id,
      coachName: c.coach_id ? (coachMap.get(c.coach_id) ?? null) : null,
      nextMonth: c.current_month! + 1,
      nextDateObj: addMonths(parseISO(c.start_date!), c.current_month!),
    }))
    .filter((c) => c.nextDateObj <= monthEnd)
    .map(({ nextDateObj, ...rest }) => ({ ...rest, nextDate: format(nextDateObj, "yyyy-MM-dd") }));

  const today = upcoming.filter((c) => isToday(parseISO(c.nextDate)));
  const thisWeek = upcoming.filter((c) =>
    isWithinInterval(parseISO(c.nextDate), { start: now, end: new Date(now.getTime() + 6 * 86400000) })
  );
  const thisMonth = upcoming;

  const coaches = Array.from(coachMap.entries()).map(([id, name]) => ({ id, name: name ?? "Unknown" }));
  const programs = Array.from(new Set(clients.map((c) => c.program_type).filter(Boolean))) as string[];

  return { today, thisWeek, thisMonth, coaches, programs };
}
