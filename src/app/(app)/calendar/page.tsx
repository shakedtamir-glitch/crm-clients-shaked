import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCalendarData } from "@/app/(app)/calendar/data";
import { CalendarGrid } from "@/app/(app)/calendar/calendar-grid";
import { NewEventDialog } from "@/app/(app)/calendar/event-form";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth();

  const supabase = await createClient();
  const [{ items, monthStart, rangeStart, rangeEnd }, { data: clients }] = await Promise.all([
    getCalendarData(year, month),
    supabase.from("clients").select("id, full_name").order("full_name"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-0">Calendar</h1>
          <p className="text-sm text-text-2">Calls, payment reminders, coaching endings, and follow-ups.</p>
        </div>
        <NewEventDialog clients={clients ?? []} />
      </div>

      <CalendarGrid
        items={items}
        rangeStart={format(rangeStart, "yyyy-MM-dd")}
        rangeEnd={format(rangeEnd, "yyyy-MM-dd")}
        monthStart={format(monthStart, "yyyy-MM-dd")}
        year={year}
        month={month}
      />
    </div>
  );
}
