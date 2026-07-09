"use client";

import { useActionState } from "react";
import { Plus, Mail, MessageSquare, Phone, Send } from "lucide-react";
import type { Communication, EmailTemplate } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { addCommunicationAction, sendClientEmailAction, type FormState } from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";

const ICONS = { email: Mail, message: MessageSquare, call: Phone };
const initialState: FormState = { error: null };

export function CommunicationTab({
  clientId,
  communications,
  templates,
}: {
  clientId: string;
  communications: Communication[];
  templates: EmailTemplate[];
}) {
  const action = addCommunicationAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const sendAction = sendClientEmailAction.bind(null, clientId);
  const [sendState, sendFormAction, sendPending] = useActionState(sendAction, initialState);

  return (
    <Card>
      <CardHeader className="flex-wrap gap-2">
        <CardTitle>Communication log</CardTitle>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Send className="h-3.5 w-3.5" /> Send email
              </Button>
            </DialogTrigger>
            <DialogContent title="Send templated email">
              <form action={sendFormAction} className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="template_key">Template</Label>
                  <NativeSelect id="template_key" name="template_key" defaultValue="">
                    <option value="" disabled>
                      Choose a template…
                    </option>
                    {templates.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <p className="text-[12px] text-text-3">
                  Sends immediately using this client&apos;s live details ({"{{"}ClientName{"}}"}, {"{{"}CurrentMonth
                  {"}}"}, {"{{"}Program{"}}"}, etc).
                </p>
                {sendState.error && <p className="text-[13px] text-danger">{sendState.error}</p>}
                <Button type="submit" disabled={sendPending} className="justify-center">
                  {sendPending ? "Sending…" : "Send now"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" /> Log communication
              </Button>
            </DialogTrigger>
            <DialogContent title="Log communication">
              <form action={formAction} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <NativeSelect id="type" name="type" defaultValue="email">
                      <option value="email">Email</option>
                      <option value="message">Message</option>
                      <option value="call">Call</option>
                    </NativeSelect>
                  </div>
                  <div>
                    <Label htmlFor="direction">Direction</Label>
                    <NativeSelect id="direction" name="direction" defaultValue="outbound">
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </NativeSelect>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" />
                </div>
                <div>
                  <Label htmlFor="body">Details</Label>
                  <Textarea id="body" name="body" />
                </div>
                {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
                <Button type="submit" disabled={pending} className="justify-center">
                  {pending ? "Saving…" : "Save"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border pt-4">
        {communications.length === 0 && <p className="text-sm text-text-3">No communication logged yet.</p>}
        {communications.map((c) => {
          const Icon = ICONS[c.type];
          return (
            <div key={c.id} className="flex items-start gap-3 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-text-2">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-text-0">{c.subject || c.type}</p>
                  <span className="shrink-0 text-[12px] text-text-3">{formatDate(c.occurred_at)}</span>
                </div>
                {c.body && <p className="mt-0.5 text-[13px] text-text-2">{c.body}</p>}
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-text-3">{c.direction}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
