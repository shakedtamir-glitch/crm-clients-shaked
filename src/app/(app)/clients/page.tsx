import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ClientsFiltersBar } from "@/app/(app)/clients/filters-bar";
import { NewClientDialog } from "@/app/(app)/clients/client-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClientOverview, ClientStatus } from "@/lib/supabase/types";

const STATUS_TONE = { active: "success", paused: "warning", ended: "neutral" } as const;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; country?: string; program?: string }>;
}) {
  const { q, status, country, program } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("client_overview").select("*").order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status as ClientStatus);
  if (country && country !== "all") query = query.eq("country", country);
  if (program && program !== "all") query = query.eq("program_type", program);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,instagram.ilike.%${q}%`);

  const [{ data: clients }, { data: allClients }, { data: coaches }] = await Promise.all([
    query,
    supabase.from("clients").select("country, program_type"),
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const countries = Array.from(new Set((allClients ?? []).map((c) => c.country).filter(Boolean))) as string[];
  const programs = Array.from(new Set((allClients ?? []).map((c) => c.program_type).filter(Boolean))) as string[];

  const rows = (clients ?? []) as ClientOverview[];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-0">Clients</h1>
          <p className="text-sm text-text-2">{rows.length} client{rows.length === 1 ? "" : "s"}</p>
        </div>
        <NewClientDialog coaches={coaches ?? []} />
      </div>

      <ClientsFiltersBar countries={countries} programs={programs} />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-text-3">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Next payment</th>
                <th className="px-4 py-3 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="flex items-center gap-2.5">
                      <Avatar name={c.full_name} size={28} />
                      <div>
                        <p className="font-medium text-text-0">{c.full_name}</p>
                        <p className="text-[12px] text-text-3">{c.email ?? c.country ?? "—"}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                      {c.payment_overdue && <Badge tone="danger">overdue</Badge>}
                      {c.payment_due_soon && !c.payment_overdue && <Badge tone="warning">due soon</Badge>}
                      {c.coaching_ending_soon && <Badge tone="info">ending soon</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-1">{c.program_type ?? "—"}</td>
                  <td className="px-4 py-3 text-text-1">{c.current_month ? `Month ${c.current_month}` : "—"}</td>
                  <td className="px-4 py-3 text-text-1">
                    {c.next_payment_date ? (
                      <>
                        {formatDate(c.next_payment_date)}
                        {c.payment_amount && (
                          <span className="ml-1 text-text-3">
                            ({formatCurrency(Number(c.payment_amount), c.payment_currency)})
                          </span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map((t) => (
                        <Badge key={t} tone="accent">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-text-3">
                    No clients found. Add your first client to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
