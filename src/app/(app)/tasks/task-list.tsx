"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toggleTaskCompleteAction, deleteTaskAction } from "@/app/(app)/tasks/actions";
import type { Task, TaskPriority } from "@/lib/supabase/types";

const PRIORITY_TONE: Record<TaskPriority, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

type TaskWithLinks = Task & {
  clientName?: string | null;
  leadName?: string | null;
};

export function TaskList({ tasks }: { tasks: TaskWithLinks[] }) {
  if (tasks.length === 0) {
    return <p className="py-10 text-center text-sm text-text-3">No tasks here.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-start gap-3 py-3">
          <input
            type="checkbox"
            checked={t.completed}
            onChange={(e) => toggleTaskCompleteAction(t.id, e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-[13px] font-medium ${t.completed ? "text-text-3 line-through" : "text-text-0"}`}>
                {t.title}
              </p>
              <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
            </div>
            {t.description && <p className="mt-0.5 text-[12px] text-text-2">{t.description}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-text-3">
              {t.due_date && <span>Due {formatDate(t.due_date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
              {t.clientName && (
                <Link href={`/clients/${t.client_id}`} className="hover:text-accent-strong">
                  Client: {t.clientName}
                </Link>
              )}
              {t.leadName && <span>Lead: {t.leadName}</span>}
            </div>
          </div>
          <button
            onClick={() => deleteTaskAction(t.id)}
            className="shrink-0 rounded-lg p-1.5 text-text-3 hover:bg-danger-soft hover:text-danger"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
