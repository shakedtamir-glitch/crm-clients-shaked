"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
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
const PIE_COLORS = ["var(--accent)", "var(--success)", "var(--info)", "var(--warning)", "var(--danger)", "#a78bfa", "#f472b6", "#38bdf8"];

export function RevenueByMonthChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue (last 12 months)</CardTitle>
      </CardHeader>
      <CardContent className="h-64 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "var(--border)" }} tickLine={false} interval={1} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={48} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="revenue" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function DistributionPie({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-text-3">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {data.map((d, i) => (
            <span key={d.name} className="flex items-center gap-1.5 text-[11px] text-text-2">
              <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              {d.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RevenueByCountryChart({ data }: { data: { name: string; value: number }[] }) {
  return <DistributionPie title="Revenue by country" data={data} />;
}
export function RevenueByProgramChart({ data }: { data: { name: string; value: number }[] }) {
  return <DistributionPie title="Revenue by program" data={data} />;
}
export function RevenueByMethodChart({ data }: { data: { name: string; value: number }[] }) {
  return <DistributionPie title="Revenue by payment method" data={data} />;
}
