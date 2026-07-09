"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { createLeadAction, type FormState } from "@/app/(app)/leads/actions";

const initialState: FormState = { error: null };

export function NewLeadDialog() {
  const [state, formAction, pending] = useActionState(createLeadAction, initialState);
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
          <Plus className="h-4 w-4" /> New lead
        </Button>
      </DialogTrigger>
      <DialogContent title="New lead" className="max-w-lg">
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="full_name">Full name *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" name="instagram" placeholder="@handle" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Instagram, referral…" />
            </div>
            <div>
              <Label htmlFor="estimated_value">Estimated value</Label>
              <Input id="estimated_value" name="estimated_value" type="number" step="0.01" min={0} />
            </div>
            <div>
              <Label htmlFor="last_contact">Last contact</Label>
              <Input id="last_contact" name="last_contact" type="date" />
            </div>
            <div>
              <Label htmlFor="next_follow_up">Next follow-up</Label>
              <Input id="next_follow_up" name="next_follow_up" type="date" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </div>
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          <Button type="submit" disabled={pending} className="justify-center">
            {pending ? "Creating…" : "Create lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
