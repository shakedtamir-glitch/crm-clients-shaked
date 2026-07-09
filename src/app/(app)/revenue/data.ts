import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Payment, ClientOverview } from "@/lib/supabase/types";

type PaymentWithClient = Payment & {
  clients: { full_name: string; country: string | null; program_type: string | null } | null;
};

// `date`-only Postgres columns must be parsed as local calendar dates — see
// the note in dashboard/data.ts for why `new Date(dateOnlyString)` is unsafe.
function parseDateOnly(value: string | null | undefined) {
  return value ? parseISO(value) : new Date(0);
}

function lastNMonths(n: number) {
  const months: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({ label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), start, end });
  }
  return months;
}

export async function getRevenueData() {
  const supabase = await createClient();

  const [{ data: paymentsRaw }, { data: overviewRaw }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, clients(full_name, country, program_type)")
      .order("created_at", { ascending: false }),
    supabase.from("client_overview").select("*"),
  ]);

  const payments = (paymentsRaw ?? []) as unknown as PaymentWithClient[];
  const clients = (overviewRaw ?? []) as ClientOverview[];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const paid = payments.filter((p) => p.status === "paid" && p.paid_date);

  const monthlyIncome = paid
    .filter((p) => parseDateOnly(p.paid_date) >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const yearlyIncome = paid
    .filter((p) => parseDateOnly(p.paid_date) >= startOfYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outstandingInvoices = payments.filter((p) => p.status === "pending" || p.status === "overdue");
  const outstandingTotal = outstandingInvoices.reduce((sum, p) => sum + Number(p.amount), 0);

  const months = lastNMonths(12);
  const revenueByMonth = months.map(({ label, start, end }) => ({
    month: label,
    revenue: paid
      .filter((p) => {
        const d = parseDateOnly(p.paid_date);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));

  function groupBy(keyFn: (p: PaymentWithClient) => string | null) {
    const map = new Map<string, number>();
    for (const p of paid) {
      const key = keyFn(p) || "Unknown";
      map.set(key, (map.get(key) ?? 0) + Number(p.amount));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }

  const revenueByCountry = groupBy((p) => p.clients?.country ?? null);
  const revenueByProgram = groupBy((p) => p.clients?.program_type ?? null);
  const revenueByMethod = groupBy((p) => p.method ?? null);

  const paymentReminders = clients
    .filter((c) => c.payment_due_soon || c.payment_overdue)
    .sort((a, b) => parseDateOnly(a.next_payment_date).getTime() - parseDateOnly(b.next_payment_date).getTime());

  return {
    stats: { monthlyIncome, yearlyIncome, outstandingTotal, outstandingCount: outstandingInvoices.length },
    charts: { revenueByMonth, revenueByCountry, revenueByProgram, revenueByMethod },
    outstandingInvoices,
    paymentReminders,
  };
}
