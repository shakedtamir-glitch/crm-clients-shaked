import { parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ClientOverview, Lead, Payment, Activity, LeadStage } from "@/lib/supabase/types";

// `date`-only Postgres columns (no time/zone) must be parsed as local calendar
// dates — the native `Date` constructor treats "yyyy-MM-dd" as UTC midnight,
// which silently shifts month-boundary comparisons in timezones ahead of UTC.
function parseDateOnly(value: string | null | undefined) {
  return value ? parseISO(value) : new Date(0);
}

const MONTHLY_MULTIPLIER: Record<string, number> = {
  weekly: 4.33,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
  one_time: 0,
};

function monthKey(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function lastNMonths(n: number) {
  const months: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    months.push({ label: monthKey(start), start, end });
  }
  return months;
}

export async function getDashboardData() {
  const supabase = await createClient();

  const [{ data: overviewRaw }, { data: leadsRaw }, { data: paymentsRaw }, { data: activitiesRaw }] =
    await Promise.all([
      supabase.from("client_overview").select("*"),
      supabase.from("leads").select("*"),
      supabase.from("payments").select("*").order("paid_date", { ascending: true }),
      supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const clients = (overviewRaw ?? []) as ClientOverview[];
  const leads = (leadsRaw ?? []) as Lead[];
  const payments = (paymentsRaw ?? []) as Payment[];
  const activities = (activitiesRaw ?? []) as Activity[];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const activeClients = clients.filter((c) => c.status === "active");
  const openLeads = leads.filter((l) => l.stage !== "closed_won" && l.stage !== "closed_lost");
  const newLeadsThisMonth = leads.filter((l) => new Date(l.created_at) >= startOfMonth);
  const closedWon = leads.filter((l) => l.stage === "closed_won");

  const paidPayments = payments.filter((p) => p.status === "paid" && p.paid_date);
  const revenueThisMonth = paidPayments
    .filter((p) => parseDateOnly(p.paid_date) >= startOfMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueThisYear = paidPayments
    .filter((p) => parseDateOnly(p.paid_date) >= startOfYear)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const mrr = activeClients.reduce((sum, c) => {
    if (!c.payment_amount || !c.payment_frequency) return sum;
    return sum + Number(c.payment_amount) * (MONTHLY_MULTIPLIER[c.payment_frequency] ?? 0);
  }, 0);

  const paymentDueSoon = clients.filter((c) => c.payment_due_soon).length;
  const paymentOverdue = clients.filter((c) => c.payment_overdue).length;
  const endingSoon = clients.filter((c) => c.coaching_ending_soon).length;

  const conversionRate = leads.length > 0 ? (closedWon.length / leads.length) * 100 : 0;

  const months = lastNMonths(6);

  const monthlyRevenue = months.map(({ label, start, end }) => ({
    month: label,
    revenue: paidPayments
      .filter((p) => {
        const d = parseDateOnly(p.paid_date);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));

  const newClients = months.map(({ label, start, end }) => ({
    month: label,
    clients: clients.filter((c) => {
      const d = new Date(c.created_at);
      return d >= start && d <= end;
    }).length,
  }));

  const stageLabels: Record<LeadStage, string> = {
    new: "New",
    contacted: "Contacted",
    discovery_call: "Discovery",
    interested: "Interested",
    follow_up: "Follow-up",
    closed_won: "Won",
    closed_lost: "Lost",
  };
  const leadConversion = (Object.keys(stageLabels) as LeadStage[]).map((stage) => ({
    stage: stageLabels[stage],
    count: leads.filter((l) => l.stage === stage).length,
  }));

  const retention = months.map(({ label, end }) => {
    const startedByThen = clients.filter((c) => c.start_date && parseDateOnly(c.start_date) <= end);
    const retained = startedByThen.filter(
      (c) => c.status === "active" || (c.end_date && parseDateOnly(c.end_date) >= end)
    );
    return {
      month: label,
      rate: startedByThen.length > 0 ? Math.round((retained.length / startedByThen.length) * 100) : 0,
    };
  });

  const upcomingReminders = [
    ...clients
      .filter((c) => c.payment_due_soon || c.payment_overdue)
      .map((c) => ({
        id: `payment-${c.id}`,
        label: `${c.full_name} — payment ${c.payment_overdue ? "overdue" : "due soon"}`,
        date: c.next_payment_date,
        tone: c.payment_overdue ? ("danger" as const) : ("warning" as const),
        href: `/clients/${c.id}`,
      })),
    ...clients
      .filter((c) => c.coaching_ending_soon)
      .map((c) => ({
        id: `ending-${c.id}`,
        label: `${c.full_name} — coaching ending soon`,
        date: c.end_date,
        tone: "info" as const,
        href: `/clients/${c.id}`,
      })),
    ...leads
      .filter((l) => l.next_follow_up && parseDateOnly(l.next_follow_up) <= new Date(now.getTime() + 7 * 86400000))
      .map((l) => ({
        id: `followup-${l.id}`,
        label: `${l.full_name} — follow-up due`,
        date: l.next_follow_up,
        tone: "accent" as const,
        href: "/leads",
      })),
  ]
    .sort((a, b) => parseDateOnly(a.date).getTime() - parseDateOnly(b.date).getTime())
    .slice(0, 8);

  return {
    stats: {
      activeClients: activeClients.length,
      totalLeads: openLeads.length,
      newLeadsThisMonth: newLeadsThisMonth.length,
      revenueThisMonth,
      revenueThisYear,
      mrr,
      paymentDueSoon,
      paymentOverdue,
      endingSoon,
      conversionRate,
    },
    charts: { monthlyRevenue, newClients, leadConversion, retention },
    activities,
    upcomingReminders,
  };
}
