"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createTaskAction, type FormState } from "@/app/(app)/tasks/actions";

const initialState: FormState = { error: null };

export function NewTaskDialog({
  clients,
  leads,
}: {
  clients: { id: string; full_name: string }[];
  leads: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="md">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </DialogTrigger>
      <DialogContent title="New task" className="max-w-lg">
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <NativeSelect id="priority" name="priority" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="due_date">Deadline</Label>
              <Input id="due_date" name="due_date" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="reminder_at">Reminder</Label>
              <Input id="reminder_at" name="reminder_at" type="datetime-local" />
            </div>
            <div>
              <Label htmlFor="client_id">Client</Label>
              <NativeSelect id="client_id" name="client_id" defaultValue="">
                <option value="">None</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="lead_id">Lead</Label>
              <NativeSelect id="lead_id" name="lead_id" defaultValue="">
                <option value="">None</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Creating…" : "Create task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
