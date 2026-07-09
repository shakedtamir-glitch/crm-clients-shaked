"use client";

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const axisStyle = { fontSize: 12, fill: "var(--text-3)" };
const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text-0)",
};

export function RevenueGrowthChart({ data }: { data: { month: string; revenue: number; growth: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue growth</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis yAxisId="left" tick={axisStyle} axisLine={false} tickLine={false} width={48} />
            <YAxis yAxisId="right" orientation="right" tick={axisStyle} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => (name === "revenue" ? formatCurrency(Number(v)) : `${v}%`)}
            />
            <Bar yAxisId="left" dataKey="revenue" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={24} />
            <Line yAxisId="right" type="monotone" dataKey="growth" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopCountriesChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top countries (by clients)</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-text-3">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={axisStyle} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="value" fill="var(--info)" radius={[0, 6, 6, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
