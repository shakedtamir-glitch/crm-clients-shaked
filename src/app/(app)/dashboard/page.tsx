import {
  Users,
  Kanban,
  UserPlus,
  Wallet,
  TrendingUp,
  Repeat,
  Clock,
  AlertTriangle,
  CalendarClock,
  Percent,
} from "lucide-react";
import { getDashboardData } from "@/app/(app)/dashboard/data";
import { getMilestonesData } from "@/app/(app)/dashboard/milestones-data";
import { MilestonesWidget } from "@/app/(app)/dashboard/milestones-widget";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MonthlyRevenueChart,
  NewClientsChart,
  LeadConversionChart,
  RetentionChart,
} from "@/app/(app)/dashboard/charts";
import Link from "next/link";

export default async function DashboardPage() {
  const [{ stats, charts, activities, upcomingReminders }, milestones] = await Promise.all([
    getDashboardData(),
    getMilestonesData(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-0">Dashboard</h1>
        <p className="text-sm text-text-2">Your coaching business at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Active clients" value={String(stats.activeClients)} icon={Users} />
        <StatCard label="Total leads" value={String(stats.totalLeads)} icon={Kanban} />
        <StatCard label="New leads (mo)" value={String(stats.newLeadsThisMonth)} icon={UserPlus} />
        <StatCard label="Revenue (mo)" value={formatCurrency(stats.revenueThisMonth)} icon={Wallet} tone="success" />
        <StatCard label="Revenue (yr)" value={formatCurrency(stats.revenueThisYear)} icon={TrendingUp} tone="success" />
        <StatCard label="MRR" value={formatCurrency(stats.mrr)} icon={Repeat} />
        <StatCard
          label="Payment due soon"
          value={String(stats.paymentDueSoon)}
          icon={Clock}
          tone={stats.paymentDueSoon > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Overdue payments"
          value={String(stats.paymentOverdue)}
          icon={AlertTriangle}
          tone={stats.paymentOverdue > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Ending soon"
          value={String(stats.endingSoon)}
          icon={CalendarClock}
          tone={stats.endingSoon > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Conversion rate" value={`${stats.conversionRate.toFixed(1)}%`} icon={Percent} />
      </div>

      <MilestonesWidget
        today={milestones.today}
        thisWeek={milestones.thisWeek}
        thisMonth={milestones.thisMonth}
        coaches={milestones.coaches}
        programs={milestones.programs}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MonthlyRevenueChart data={charts.monthlyRevenue} />
        <NewClientsChart data={charts.newClients} />
        <LeadConversionChart data={charts.leadConversion} />
        <RetentionChart data={charts.retention} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activities.length === 0 && <p className="text-sm text-text-3">No activity yet.</p>}
            {activities.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-[13px] text-text-1">{a.description}</p>
                <span className="shrink-0 text-[12px] text-text-3">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming reminders</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingReminders.length === 0 && <p className="text-sm text-text-3">Nothing upcoming — you&apos;re all caught up.</p>}
            {upcomingReminders.map((r) => (
              <Link
                key={r.id}
                href={r.href}
                className="flex items-center justify-between gap-3 border-b border-border pb-3 text-[13px] last:border-0 last:pb-0 hover:text-text-0"
              >
                <span className="text-text-1">{r.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {r.date && <span className="text-[12px] text-text-3">{formatDate(r.date)}</span>}
                  <Badge tone={r.tone}>{r.tone}</Badge>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
