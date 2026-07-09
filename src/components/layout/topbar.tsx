"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SidebarNav } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/supabase/types";

export function Topbar({ name, email, notifications }: { name: string; email: string; notifications: Notification[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface-0/85 px-4 backdrop-blur sm:px-6">
      <RadixDialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <RadixDialog.Trigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu className="h-4.5 w-4.5" />
          </Button>
        </RadixDialog.Trigger>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
          <RadixDialog.Content className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface-1 lg:hidden">
            <RadixDialog.Title className="sr-only">Navigation</RadixDialog.Title>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell notifications={notifications} />
        <ThemeToggle />
        <UserMenu name={name} email={email} />
      </div>
    </header>
  );
}
