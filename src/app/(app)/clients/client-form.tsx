"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, NativeSelect } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createClientAction, updateClientAction, type FormState } from "@/app/(app)/clients/actions";
import type { Client } from "@/lib/supabase/types";

const initialState: FormState = { error: null };

type Coach = { id: string; full_name: string | null };

function ClientFields({ client, coaches }: { client?: Client; coaches: Coach[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label htmlFor="full_name">Full name *</Label>
        <Input id="full_name" name="full_name" required defaultValue={client?.full_name} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
      </div>
      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input id="instagram" name="instagram" placeholder="@handle" defaultValue={client?.instagram ?? ""} />
      </div>
      <div>
        <Label htmlFor="country">Country</Label>
        <Input id="country" name="country" defaultValue={client?.country ?? ""} />
      </div>
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input id="timezone" name="timezone" placeholder="GMT+2" defaultValue={client?.timezone ?? ""} />
      </div>
      <div>
        <Label htmlFor="age">Age</Label>
        <Input id="age" name="age" type="number" min={0} defaultValue={client?.age ?? ""} />
      </div>

      <div className="col-span-2 mt-1 border-t border-border pt-3 text-[12px] font-semibold uppercase tracking-wide text-text-3">
        Coaching
      </div>
      <div>
        <Label htmlFor="start_date">Start date</Label>
        <Input id="start_date" name="start_date" type="date" defaultValue={client?.start_date ?? ""} />
      </div>
      <div>
        <Label htmlFor="end_date">End date</Label>
        <Input id="end_date" name="end_date" type="date" defaultValue={client?.end_date ?? ""} />
      </div>
      <div>
        <Label htmlFor="program_type">Program type</Label>
        <Input id="program_type" name="program_type" placeholder="1:1 Coaching" defaultValue={client?.program_type ?? ""} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <NativeSelect id="status" name="status" defaultValue={client?.status ?? "active"}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="ended">Ended</option>
        </NativeSelect>
      </div>
      <div className="col-span-2">
        <Label htmlFor="coach_id">Coach</Label>
        <NativeSelect id="coach_id" name="coach_id" defaultValue={client?.coach_id ?? ""}>
          <option value="">Unassigned</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name ?? "Unnamed"}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="col-span-2">
        <Label htmlFor="goals">Goals</Label>
        <Textarea id="goals" name="goals" defaultValue={client?.goals ?? ""} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ""} />
      </div>

      <div className="col-span-2 mt-1 border-t border-border pt-3 text-[12px] font-semibold uppercase tracking-wide text-text-3">
        Payment
      </div>
      <div>
        <Label htmlFor="payment_amount">Amount</Label>
        <Input id="payment_amount" name="payment_amount" type="number" step="0.01" min={0} defaultValue={client?.payment_amount ?? ""} />
      </div>
      <div>
        <Label htmlFor="payment_currency">Currency</Label>
        <Input id="payment_currency" name="payment_currency" defaultValue={client?.payment_currency ?? "USD"} />
      </div>
      <div>
        <Label htmlFor="payment_frequency">Frequency</Label>
        <NativeSelect id="payment_frequency" name="payment_frequency" defaultValue={client?.payment_frequency ?? "monthly"}>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
          <option value="one_time">One-time</option>
        </NativeSelect>
      </div>
      <div>
        <Label htmlFor="next_payment_date">Next payment date</Label>
        <Input id="next_payment_date" name="next_payment_date" type="date" defaultValue={client?.next_payment_date ?? ""} />
      </div>

      <div className="col-span-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" placeholder="VIP, Planche, Front Lever" defaultValue={client?.tags?.join(", ") ?? ""} />
      </div>
    </div>
  );
}

export function NewClientDialog({ coaches }: { coaches: Coach[] }) {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="md">
          <Plus className="h-4 w-4" /> New client
        </Button>
      </DialogTrigger>
      <DialogContent title="New client" className="max-w-2xl">
        <form action={formAction} className="flex flex-col gap-4">
          <ClientFields coaches={coaches} />
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Creating…" : "Create client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditClientDialog({ client, coaches }: { client: Client; coaches: Coach[] }) {
  const action = updateClientAction.bind(null, client.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent title="Edit client" className="max-w-2xl">
        <form action={formAction} className="flex flex-col gap-4">
          <ClientFields client={client} coaches={coaches} />
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
