"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AtSign, Mail, ArrowRightCircle, Trash2 } from "lucide-react";
import type { Lead } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { convertLeadToClientAction, deleteLeadAction } from "@/app/(app)/leads/actions";

export function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group cursor-grab rounded-xl border border-border bg-surface-2 p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-text-0">{lead.full_name}</p>
        {lead.estimated_value != null && (
          <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-strong">
            {formatCurrency(Number(lead.estimated_value))}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-text-3">
        {lead.email && (
          <span className="flex items-center gap-1 truncate">
            <Mail className="h-3 w-3" /> {lead.email}
          </span>
        )}
        {lead.instagram && (
          <span className="flex items-center gap-1 truncate">
            <AtSign className="h-3 w-3" /> {lead.instagram}
          </span>
        )}
        {lead.next_follow_up && <span>Follow-up: {formatDate(lead.next_follow_up)}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => convertLeadToClientAction(lead.id)}
          className="flex items-center gap-1 text-[11px] font-medium text-success hover:underline"
        >
          <ArrowRightCircle className="h-3 w-3" /> Convert
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            if (confirm(`Delete lead ${lead.full_name}?`)) deleteLeadAction(lead.id);
          }}
          className="text-text-3 hover:text-danger"
          aria-label="Delete lead"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
