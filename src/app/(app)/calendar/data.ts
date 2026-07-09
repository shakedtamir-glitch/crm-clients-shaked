import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { CalendarEvent, Client, Lead } from "@/lib/supabase/types";

export type CalendarItemType =
  | "client_call"
  | "discovery_call"
  | "check_in"
  | "follow_up"
  | "other"
  | "payment_due"
  | "coaching_ending";

export type CalendarItem = {
  id: string;
  date: string; // yyyy-MM-dd
  title: string;
  type: CalendarItemType;
  href?: string;
  deletable?: boolean;
};

export async function getCalendarData(year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const rangeStart = startOfWeek(monthStart);
  const rangeEnd = endOfWeek(monthEnd);

  const rangeStartStr = format(rangeStart, "yyyy-MM-dd");
  const rangeEndStr = format(rangeEnd, "yyyy-MM-dd");

  const supabase = await createClient();

  const [{ data: eventsRaw }, { data: clientsRaw }, { data: leadsRaw }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .gte("starts_at", rangeStart.toISOString())
      .lte("starts_at", rangeEnd.toISOString()),
    supabase
      .from("clients")
      .select("*")
      .or(
        `and(end_date.gte.${rangeStartStr},end_date.lte.${rangeEndStr}),and(next_payment_date.gte.${rangeStartStr},next_payment_date.lte.${rangeEndStr})`
      ),
    supabase.from("leads").select("*").gte("next_follow_up", rangeStartStr).lte("next_follow_up", rangeEndStr),
  ]);

  const events = (eventsRaw ?? []) as CalendarEvent[];
  const clients = (clientsRaw ?? []) as Client[];
  const leads = (leadsRaw ?? []) as Lead[];

  const items: CalendarItem[] = [];

  for (const e of events) {
    items.push({
      id: `event-${e.id}`,
      date: format(new Date(e.starts_at), "yyyy-MM-dd"),
      title: e.title,
      type: e.type,
      href: e.client_id ? `/clients/${e.client_id}` : undefined,
      deletable: true,
    });
  }

  for (const c of clients) {
    if (c.end_date && c.end_date >= rangeStartStr && c.end_date <= rangeEndStr) {
      items.push({
        id: `ending-${c.id}`,
        date: c.end_date,
        title: `${c.full_name} — coaching ending`,
        type: "coaching_ending",
        href: `/clients/${c.id}`,
      });
    }
    if (c.next_payment_date && c.next_payment_date >= rangeStartStr && c.next_payment_date <= rangeEndStr) {
      items.push({
        id: `payment-${c.id}`,
        date: c.next_payment_date,
        title: `${c.full_name} — payment due`,
        type: "payment_due",
        href: `/clients/${c.id}`,
      });
    }
  }

  for (const l of leads) {
    if (l.next_follow_up) {
      items.push({
        id: `followup-${l.id}`,
        date: l.next_follow_up,
        title: `${l.full_name} — follow-up`,
        type: "follow_up",
        href: "/leads",
      });
    }
  }

  return { items, monthStart, monthEnd, rangeStart, rangeEnd };
}
