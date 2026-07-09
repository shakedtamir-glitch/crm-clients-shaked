"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eachDayOfInterval, format, isSameMonth, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { deleteEventAction } from "@/app/(app)/calendar/actions";
import type { CalendarItem, CalendarItemType } from "@/app/(app)/calendar/data";

const TYPE_STYLES: Record<CalendarItemType, string> = {
  client_call: "bg-accent-soft text-accent-strong",
  discovery_call: "bg-info-soft text-info",
  check_in: "bg-success-soft text-success",
  follow_up: "bg-accent-soft text-accent-strong",
  other: "bg-surface-3 text-text-2",
  payment_due: "bg-warning-soft text-warning",
  coaching_ending: "bg-danger-soft text-danger",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  items,
  rangeStart,
  rangeEnd,
  monthStart,
  year,
  month,
}: {
  items: CalendarItem[];
  rangeStart: string;
  rangeEnd: string;
  monthStart: string;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const days = eachDayOfInterval({ start: parseISO(rangeStart), end: parseISO(rangeEnd) });
  const [selected, setSelected] = useState<string | null>(null);

  function goToMonth(y: number, m: number) {
    router.push(`/calendar?year=${y}&month=${m}`);
  }

  function prevMonth() {
    goToMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  }
  function nextMonth() {
    goToMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  }

  const itemsByDay = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const list = itemsByDay.get(item.date) ?? [];
    list.push(item);
    itemsByDay.set(item.date, list);
  }

  const selectedItems = selected ? (itemsByDay.get(selected) ?? []) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-0">{format(parseISO(monthStart), "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface-2 px-2 py-1.5 text-center text-[11px] font-medium text-text-3">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDay.get(dateStr) ?? [];
          const inMonth = isSameMonth(day, parseISO(monthStart));
          return (
            <button
              key={dateStr}
              onClick={() => setSelected(dateStr)}
              className={cn(
                "min-h-[84px] bg-surface-1 p-1.5 text-left align-top transition-colors hover:bg-surface-2",
                !inMonth && "opacity-40",
                selected === dateStr && "ring-2 ring-inset ring-accent"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                  isToday(day) && "bg-accent font-semibold text-black"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium", TYPE_STYLES[item.type])}
                  >
                    {item.title}
                  </span>
                ))}
                {dayItems.length > 3 && <span className="text-[10px] text-text-3">+{dayItems.length - 3} more</span>}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="mb-3 text-[13px] font-semibold text-text-0">{format(parseISO(selected), "EEEE, MMMM d")}</p>
          {selectedItems.length === 0 && <p className="text-sm text-text-3">Nothing scheduled.</p>}
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", TYPE_STYLES[item.type])}>
                  {item.type.replace("_", " ")}
                </span>
                {item.href ? (
                  <Link href={item.href} className="flex-1 truncate text-[13px] text-text-1 hover:text-accent-strong">
                    {item.title}
                  </Link>
                ) : (
                  <span className="flex-1 truncate text-[13px] text-text-1">{item.title}</span>
                )}
                {item.deletable && (
                  <button
                    onClick={() => deleteEventAction(item.id.replace("event-", ""))}
                    className="shrink-0 text-text-3 hover:text-danger"
                    aria-label="Delete event"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
