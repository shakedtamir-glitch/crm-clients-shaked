"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { markPaymentPaidAction } from "@/app/(app)/revenue/actions";
import type { Payment } from "@/lib/supabase/types";

type Row = Payment & { clients: { full_name: string } | null };

export function InvoicesTable({ invoices }: { invoices: Row[] }) {
  if (invoices.length === 0) {
    return <p className="p-5 text-sm text-text-3">No outstanding invoices — nice work.</p>;
  }

  const today = new Date();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border text-text-3">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Due date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isOverdue = inv.due_date ? new Date(inv.due_date) < today : false;
            return (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-4 py-3">
                  <Link href={`/clients/${inv.client_id}`} className="font-medium text-text-0 hover:text-accent-strong">
                    {inv.clients?.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-1">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                <td className="px-4 py-3 text-text-1">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={isOverdue ? "danger" : "warning"}>{isOverdue ? "overdue" : "pending"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => markPaymentPaidAction(inv.id, inv.client_id)}>
                    Mark paid
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
