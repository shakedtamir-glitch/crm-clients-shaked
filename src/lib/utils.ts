import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO } from "date-fns";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    amount
  );
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  // `date`-only values ("yyyy-MM-dd", no time/zone) must be parsed as local
  // calendar dates via parseISO — the native Date constructor treats them as
  // UTC midnight, which shifts the displayed day in timezones ahead of UTC.
  const d = typeof date === "string" ? (DATE_ONLY_RE.test(date) ? parseISO(date) : new Date(date)) : date;
  return d.toLocaleDateString("en-US", options ?? { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
