"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const axisStyle = { fontSize: 12, fill: "var(--text-3)" };
const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--text-0)",
};

export function MonthlyRevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent className="h-56 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={44} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
            <Bar dataKey="revenue" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function NewClientsChart({ data }: { data: { month: string; clients: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Clients</CardTitle>
      </CardHeader>
      <CardContent className="h-56 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="clients"
              stroke="var(--success)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--success)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function LeadConversionChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Conversion</CardTitle>
      </CardHeader>
      <CardContent className="h-56 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              dataKey="stage"
              type="category"
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
            <Bar dataKey="count" fill="var(--info)" radius={[0, 6, 6, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RetentionChart({ data }: { data: { month: string; rate: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention Rate</CardTitle>
      </CardHeader>
      <CardContent className="h-56 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 8, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis
              tick={axisStyle}
              axisLine={false}
              tickLine={false}
              width={40}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Retention"]} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "var(--accent)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
