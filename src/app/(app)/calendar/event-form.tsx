"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createEventAction, type FormState } from "@/app/(app)/calendar/actions";

const initialState: FormState = { error: null };

export function NewEventDialog({ clients }: { clients: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);
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
          <Plus className="h-4 w-4" /> New event
        </Button>
      </DialogTrigger>
      <DialogContent title="New calendar event" className="max-w-lg">
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required placeholder="Discovery call with…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <NativeSelect id="type" name="type" defaultValue="client_call">
                <option value="client_call">Client call</option>
                <option value="discovery_call">Discovery call</option>
                <option value="check_in">Weekly check-in</option>
                <option value="follow_up">Follow-up</option>
                <option value="other">Other</option>
              </NativeSelect>
            </div>
            <div>
              <Label htmlFor="starts_at">Date & time *</Label>
              <Input id="starts_at" name="starts_at" type="datetime-local" required />
            </div>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Creating…" : "Create event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
