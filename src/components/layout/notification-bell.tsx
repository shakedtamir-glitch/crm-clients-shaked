"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/(app)/notifications/actions";
import type { Notification } from "@/lib/supabase/types";

const ENTITY_HREF: Record<string, (id: string) => string> = {
  client: (id) => `/clients/${id}`,
  lead: () => "/leads",
};

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleSelect(n: Notification) {
    void markNotificationReadAction(n.id);
    if (n.entity_type && n.entity_id) {
      const hrefFn = ENTITY_HREF[n.entity_type];
      if (hrefFn) router.push(hrefFn(n.entity_id));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <div className="flex items-center justify-between px-2.5 py-1.5">
          <span className="text-[13px] font-semibold text-text-0">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsReadAction()}
              className="text-[11px] font-medium text-accent-strong hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2.5 py-4 text-center text-[13px] text-text-3">No notifications yet.</p>
        )}
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={() => handleSelect(n)}
              className="flex-col items-start gap-0.5 whitespace-normal"
            >
              <span className={`text-[13px] ${n.is_read ? "text-text-2" : "font-medium text-text-0"}`}>{n.title}</span>
              {n.body && <span className="text-[12px] text-text-3">{n.body}</span>}
              <span className="text-[11px] text-text-3">{formatDate(n.created_at)}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
