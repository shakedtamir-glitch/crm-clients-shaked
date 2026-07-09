"use client";

import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditClientDialog } from "@/app/(app)/clients/client-form";
import { deleteClientAction } from "@/app/(app)/clients/actions";
import type { ClientOverview } from "@/lib/supabase/types";

const STATUS_TONE = { active: "success", paused: "warning", ended: "neutral" } as const;

export function ClientHeader({
  client,
  coaches,
}: {
  client: ClientOverview;
  coaches: { id: string; full_name: string | null }[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar name={client.full_name} size={48} />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-text-0">{client.full_name}</h1>
            <Badge tone={STATUS_TONE[client.status]}>{client.status}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {client.tags.map((t) => (
              <Badge key={t} tone="accent">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <EditClientDialog client={client} coaches={coaches} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(`Delete ${client.full_name}? This cannot be undone.`)) {
              deleteClientAction(client.id);
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
