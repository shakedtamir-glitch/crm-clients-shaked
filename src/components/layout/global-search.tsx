"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";

type Result = { id: string; full_name: string; email: string | null; status?: string; stage?: string };

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Result[]>([]);
  const [leads, setLeads] = useState<Result[]>([]);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const isSearchable = query.trim().length >= 2;

  useEffect(() => {
    if (!isSearchable) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setClients(data.clients ?? []);
        setLeads(data.leads ?? []);
      } catch {
        // ignore aborted/failed requests
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, isSearchable]);

  const hasResults = isSearchable && (clients.length > 0 || leads.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-3" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search clients, leads…"
          className="h-9 w-full rounded-lg border border-border bg-surface-2 pl-9 pr-3 text-[13px] text-text-0 placeholder:text-text-3 outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-11 z-40 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl animate-fade-in">
          {!hasResults && <p className="px-3 py-4 text-center text-[13px] text-text-3">No matches</p>}
          {clients.length > 0 && (
            <div className="mb-1">
              <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-text-3">Clients</p>
              {clients.map((c) => (
                <ResultRow
                  key={c.id}
                  icon={User}
                  title={c.full_name}
                  subtitle={c.email ?? c.status}
                  onClick={() => {
                    router.push(`/clients/${c.id}`);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
          {leads.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-text-3">Leads</p>
              {leads.map((l) => (
                <ResultRow
                  key={l.id}
                  icon={Kanban}
                  title={l.full_name}
                  subtitle={l.email ?? l.stage}
                  onClick={() => {
                    router.push(`/leads`);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof User;
  title: string;
  subtitle?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-text-1 hover:bg-surface-3 hover:text-text-0"
      )}
    >
      <Icon className="h-3.5 w-3.5 text-text-3" />
      <span className="truncate">{title}</span>
      {subtitle && <span className="ml-auto shrink-0 truncate text-[12px] text-text-3">{subtitle}</span>}
    </button>
  );
}
