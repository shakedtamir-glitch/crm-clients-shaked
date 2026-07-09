"use client";

import { useState } from "react";
import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Lead, LeadStage } from "@/lib/supabase/types";
import { LeadCard } from "@/app/(app)/leads/lead-card";
import { updateLeadStageAction } from "@/app/(app)/leads/actions";
import { cn } from "@/lib/utils";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "new", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "discovery_call", label: "Discovery Call" },
  { key: "interested", label: "Interested" },
  { key: "follow_up", label: "Follow-up" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
];

function Column({ stage, label, leads }: { stage: LeadStage; label: string; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border border-border bg-surface-1 p-3 transition-colors",
        isOver && "border-accent/50 bg-accent-soft/40"
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold text-text-0">{label}</h3>
        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-3">{leads.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && <p className="px-1 py-6 text-center text-[12px] text-text-3">No leads</p>}
      </div>
    </div>
  );
}

export function LeadsBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as LeadStage;
    const leadId = active.id as string;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    updateLeadStageAction(leadId, newStage);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(({ key, label }) => (
          <Column key={key} stage={key} label={label} leads={leads.filter((l) => l.stage === key)} />
        ))}
      </div>
    </DndContext>
  );
}
