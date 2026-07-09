"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { updateRoleAction } from "@/app/(app)/settings/actions";
import type { Profile, ProfileRole } from "@/lib/supabase/types";

export function TeamTable({ members, isAdmin, currentUserId }: { members: Profile[]; isAdmin: boolean; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border pt-4">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar name={m.full_name || "?"} size={30} />
              <div>
                <p className="text-[13px] font-medium text-text-0">
                  {m.full_name} {m.id === currentUserId && <span className="text-text-3">(you)</span>}
                </p>
                <p className="text-[11px] text-text-3">Joined {formatDate(m.created_at)}</p>
              </div>
            </div>
            {isAdmin ? (
              <NativeSelect
                className="h-8 w-auto text-[12px]"
                defaultValue={m.role}
                disabled={isPending}
                onChange={(e) => {
                  const role = e.target.value as ProfileRole;
                  startTransition(() => {
                    void updateRoleAction(m.id, role);
                  });
                }}
              >
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </NativeSelect>
            ) : (
              <Badge tone={m.role === "admin" ? "accent" : "neutral"}>{m.role}</Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
