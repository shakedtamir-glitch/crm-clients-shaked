import { Percent, Clock, DollarSign, Users, TrendingDown } from "lucide-react";
import { getAnalyticsData } from "@/app/(app)/analytics/data";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { RevenueGrowthChart, TopCountriesChart } from "@/app/(app)/analytics/charts";

export default async function AnalyticsPage() {
  const { stats, revenueGrowth, bestLeadSources, topCountries } = await getAnalyticsData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-0">Analytics</h1>
        <p className="text-sm text-text-2">Growth, retention, and lead performance over time.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Conversion rate" value={`${stats.conversionRate.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Avg. client lifetime" value={`${stats.avgLifetimeMonths.toFixed(1)} mo`} icon={Clock} />
        <StatCard label="Avg. client value" value={formatCurrency(stats.avgClientValue)} icon={DollarSign} tone="success" />
        <StatCard label="Retention rate" value={`${stats.retentionRate.toFixed(1)}%`} icon={Users} tone="success" />
        <StatCard label="Churn" value={`${stats.churnRate.toFixed(1)}%`} icon={TrendingDown} tone={stats.churnRate > 20 ? "danger" : "neutral"} />
      </div>

      <RevenueGrowthChart data={revenueGrowth} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopCountriesChart data={topCountries} />

        <Card>
          <CardHeader>
            <CardTitle>Best lead sources</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border pt-4">
            {bestLeadSources.length === 0 && <p className="text-sm text-text-3">No leads yet.</p>}
            {bestLeadSources.map((s) => (
              <div key={s.source} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-text-1">{s.source}</span>
                <span className="flex items-center gap-2 text-text-3">
                  {s.total} lead{s.total === 1 ? "" : "s"}
                  <Badge tone={s.rate >= 30 ? "success" : "neutral"}>{s.rate}% won</Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
