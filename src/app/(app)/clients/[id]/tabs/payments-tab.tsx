"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import type { Payment } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { addPaymentAction, type FormState } from "@/app/(app)/clients/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_TONE = { paid: "success", pending: "neutral", overdue: "danger", refunded: "info" } as const;
const initialState: FormState = { error: null };

export function PaymentsTab({ clientId, payments }: { clientId: string; payments: Payment[] }) {
  const action = addPaymentAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const outstanding = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-[13px] text-text-2">Outstanding balance</p>
          <p className="mt-1 text-xl font-semibold text-text-0">{formatCurrency(outstanding)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-text-2">Total paid</p>
          <p className="mt-1 text-xl font-semibold text-text-0">{formatCurrency(totalPaid)}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" /> Add payment
              </Button>
            </DialogTrigger>
            <DialogContent title="Add payment">
              <form action={formAction} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="USD" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <NativeSelect id="status" name="status" defaultValue="pending">
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="refunded">Refunded</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <Label htmlFor="method">Method</Label>
                    <NativeSelect id="method" name="method" defaultValue="card">
                      <option value="card">Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank transfer</option>
                      <option value="crypto">Crypto</option>
                      <option value="other">Other</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due date</Label>
                    <Input id="due_date" name="due_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="paid_date">Paid date</Label>
                    <Input id="paid_date" name="paid_date" type="date" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="invoice_number">Invoice number</Label>
                    <Input id="invoice_number" name="invoice_number" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" />
                  </div>
                </div>
                {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
                <Button type="submit" disabled={pending} className="justify-center">
                  {pending ? "Saving…" : "Save payment"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-4">
          {payments.length === 0 && <p className="text-sm text-text-3">No payments recorded yet.</p>}
          <div className="flex flex-col divide-y divide-border">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-[13px]">
                <div>
                  <p className="font-medium text-text-0">{formatCurrency(Number(p.amount), p.currency)}</p>
                  <p className="text-[12px] text-text-3">
                    {p.method ?? "—"} {p.invoice_number && `· ${p.invoice_number}`}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                  <p className="mt-1 text-[12px] text-text-3">
                    {p.paid_date ? formatDate(p.paid_date) : p.due_date ? `due ${formatDate(p.due_date)}` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
