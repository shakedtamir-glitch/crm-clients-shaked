"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/input";

const STATUS_OPTIONS = ["all", "active", "paused", "ended"];

export function ClientsFiltersBar({ countries, programs }: { countries: string[]; programs: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-[220px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            updateParam("q", e.target.value);
          }}
          placeholder="Search clients…"
          className="h-9 pl-8"
        />
      </div>

      <NativeSelect
        className="h-9 w-auto"
        defaultValue={searchParams.get("status") ?? "all"}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </NativeSelect>

      {countries.length > 0 && (
        <NativeSelect
          className="h-9 w-auto"
          defaultValue={searchParams.get("country") ?? "all"}
          onChange={(e) => updateParam("country", e.target.value)}
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </NativeSelect>
      )}

      {programs.length > 0 && (
        <NativeSelect
          className="h-9 w-auto"
          defaultValue={searchParams.get("program") ?? "all"}
          onChange={(e) => updateParam("program", e.target.value)}
        >
          <option value="all">All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  );
}
