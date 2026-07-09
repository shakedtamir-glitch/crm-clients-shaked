import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { Client, Lead, Payment } from "@/lib/supabase/types";

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
    months.push({ label: start.toLocaleDateString("en-US", { month: "short" }), start, end });
  }
  return months;
}

export async function getAnalyticsData() {
  const supabase = await createClient();

  const [{ data: clientsRaw }, { data: leadsRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("leads").select("*"),
    supabase.from("payments").select("*").eq("status", "paid"),
  ]);

  const clients = (clientsRaw ?? []) as Client[];
  const leads = (leadsRaw ?? []) as Lead[];
  const payments = (paymentsRaw ?? []) as Payment[];

  const closedWon = leads.filter((l) => l.stage === "closed_won");
  const conversionRate = leads.length > 0 ? (closedWon.length / leads.length) * 100 : 0;

  // Lead sources
  const sourceMap = new Map<string, { total: number; won: number }>();
  for (const l of leads) {
    const key = l.source || "Unknown";
    const entry = sourceMap.get(key) ?? { total: 0, won: 0 };
    entry.total += 1;
    if (l.stage === "closed_won") entry.won += 1;
    sourceMap.set(key, entry);
  }
  const bestLeadSources = Array.from(sourceMap.entries())
    .map(([source, v]) => ({ source, total: v.total, won: v.won, rate: v.total ? Math.round((v.won / v.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Top countries (by client count)
  const countryMap = new Map<string, number>();
  for (const c of clients) {
    const key = c.country || "Unknown";
    countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
  }
  const topCountries = Array.from(countryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Revenue growth (12mo) + MoM %
  const months = lastNMonths(12);
  const revenueByMonthRaw = months.map(({ start, end }) =>
    payments.filter((p) => p.paid_date && parseDateOnly(p.paid_date) >= start && parseDateOnly(p.paid_date) <= end)
      .reduce((sum, p) => sum + Number(p.amount), 0)
  );
  const revenueGrowth = months.map((m, i) => {
    const prev = i > 0 ? revenueByMonthRaw[i - 1] : 0;
    const curr = revenueByMonthRaw[i];
    const growth = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;
    return { month: m.label, revenue: curr, growth };
  });

  // Average client lifetime (months) — ended clients use end_date, active use now
  const now = new Date();
  const lifetimes = clients
    .filter((c) => c.start_date)
    .map((c) => {
      const start = parseDateOnly(c.start_date);
      const end = c.end_date ? parseDateOnly(c.end_date) : now;
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    });
  const avgLifetimeMonths = lifetimes.length ? lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length : 0;

  // Average client value (total paid / distinct paying clients)
  const clientRevenue = new Map<string, number>();
  for (const p of payments) {
    clientRevenue.set(p.client_id, (clientRevenue.get(p.client_id) ?? 0) + Number(p.amount));
  }
  const avgClientValue = clientRevenue.size
    ? Array.from(clientRevenue.values()).reduce((a, b) => a + b, 0) / clientRevenue.size
    : 0;

  // Retention & churn
  const totalClients = clients.length;
  const endedClients = clients.filter((c) => c.status === "ended").length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const retentionRate = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
  const churnRate = totalClients > 0 ? (endedClients / totalClients) * 100 : 0;

  return {
    stats: {
      conversionRate,
      avgLifetimeMonths,
      avgClientValue,
      retentionRate,
      churnRate,
    },
    revenueGrowth,
    bestLeadSources,
    topCountries,
  };
}
