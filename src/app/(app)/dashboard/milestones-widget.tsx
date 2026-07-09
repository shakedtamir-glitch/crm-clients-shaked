"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { MilestoneClient } from "@/app/(app)/dashboard/milestones-data";

export function MilestonesWidget({
  today,
  thisWeek,
  thisMonth,
  coaches,
  programs,
}: {
  today: MilestoneClient[];
  thisWeek: MilestoneClient[];
  thisMonth: MilestoneClient[];
  coaches: { id: string; name: string }[];
  programs: string[];
}) {
  const [coachFilter, setCoachFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");

  const matches = (c: MilestoneClient) =>
    (coachFilter === "all" || c.coachId === coachFilter) && (programFilter === "all" || c.program === programFilter);

  const filteredToday = today.filter(matches);
  const filteredWeek = thisWeek.filter(matches);
  const filteredMonth = thisMonth.filter(matches);

  return (
    <Card>
      <CardHeader className="flex-wrap gap-2">
        <CardTitle>Client Monthly Milestones</CardTitle>
        <div className="flex gap-2">
          <NativeSelect className="h-8 w-auto text-[12px]" value={coachFilter} onChange={(e) => setCoachFilter(e.target.value)}>
            <option value="all">All coaches</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect className="h-8 w-auto text-[12px]" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
            <option value="all">All programs</option>
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="month">
          <TabsList>
            <TabsTrigger value="today">Today ({filteredToday.length})</TabsTrigger>
            <TabsTrigger value="week">This week ({filteredWeek.length})</TabsTrigger>
            <TabsTrigger value="month">This month ({filteredMonth.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <MilestoneList clients={filteredToday} />
          </TabsContent>
          <TabsContent value="week">
            <MilestoneList clients={filteredWeek} />
          </TabsContent>
          <TabsContent value="month">
            <MilestoneList clients={filteredMonth} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MilestoneList({ clients }: { clients: MilestoneClient[] }) {
  if (clients.length === 0) {
    return <p className="py-6 text-center text-sm text-text-3">No upcoming milestones.</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-border">
      {clients.map((c) => (
        <Link
          key={c.id}
          href={`/clients/${c.id}`}
          className="flex items-center justify-between gap-3 py-2.5 text-[13px] hover:text-text-0"
        >
          <div>
            <span className="font-medium text-text-1">{c.fullName}</span>
            {c.coachName && <span className="ml-2 text-[12px] text-text-3">· {c.coachName}</span>}
          </div>
          <span className="flex items-center gap-2 text-text-3">
            {formatDate(c.nextDate)}
            <Badge tone="accent">Month {c.nextMonth}</Badge>
          </span>
        </Link>
      ))}
    </div>
  );
}
