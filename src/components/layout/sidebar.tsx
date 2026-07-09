"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black">
          <Dumbbell className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold text-text-0">Calisthenics CRM</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-text-2 hover:bg-surface-2 hover:text-text-0"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </span>
              {item.soon && (
                <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] font-medium text-text-3">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-text-3">v0.1 · MVP</div>
    </div>
  );
}
