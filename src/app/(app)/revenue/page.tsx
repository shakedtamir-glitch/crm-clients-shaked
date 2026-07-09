import Link from "next/link";
import { Wallet, TrendingUp, AlertTriangle, FileWarning } from "lucide-react";
import { getRevenueData } from "@/app/(app)/revenue/data";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  RevenueByMonthChart,
  RevenueByCountryChart,
  RevenueByProgramChart,
  RevenueByMethodChart,
} from "@/app/(app)/revenue/charts";
import { InvoicesTable } from "@/app/(app)/revenue/invoices-table";

export default async function RevenuePage() {
  const { stats, charts, outstandingInvoices, paymentReminders } = await getRevenueData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-0">Revenue</h1>
        <p className="text-sm text-text-2">Income, invoices, and payment reminders.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Income (mo)" value={formatCurrency(stats.monthlyIncome)} icon={Wallet} tone="success" />
        <StatCard label="Income (yr)" value={formatCurrency(stats.yearlyIncome)} icon={TrendingUp} tone="success" />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstandingTotal)}
          icon={FileWarning}
          tone={stats.outstandingTotal > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Open invoices"
          value={String(stats.outstandingCount)}
          icon={AlertTriangle}
          tone={stats.outstandingCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <RevenueByMonthChart data={charts.revenueByMonth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueByCountryChart data={charts.revenueByCountry} />
        <RevenueByProgramChart data={charts.revenueByProgram} />
        <RevenueByMethodChart data={charts.revenueByMethod} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <InvoicesTable invoices={outstandingInvoices} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment reminders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border pt-4">
          {paymentReminders.length === 0 && <p className="text-sm text-text-3">Nothing due soon.</p>}
          {paymentReminders.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center justify-between py-3 text-[13px] hover:text-text-0"
            >
              <span className="text-text-1">{c.full_name}</span>
              <span className="flex items-center gap-2">
                {c.next_payment_date && <span className="text-text-3">{formatDate(c.next_payment_date)}</span>}
                <Badge tone={c.payment_overdue ? "danger" : "warning"}>{c.payment_overdue ? "overdue" : "due soon"}</Badge>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
