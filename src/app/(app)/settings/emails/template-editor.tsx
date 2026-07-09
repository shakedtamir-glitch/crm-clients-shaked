"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { updateEmailTemplateAction, type FormState } from "@/app/(app)/settings/emails/actions";
import type { EmailTemplate } from "@/lib/supabase/types";

const initialState: FormState = { error: null };

const AVAILABLE_VARIABLES = [
  "{{ClientName}}",
  "{{CurrentMonth}}",
  "{{Program}}",
  "{{CoachName}}",
  "{{PaymentAmount}}",
  "{{NextPaymentDate}}",
];

export function TemplateEditor({ template }: { template: EmailTemplate }) {
  const action = updateEmailTemplateAction.bind(null, template.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <details className="group rounded-xl border border-border bg-surface-1 open:bg-surface-2/40">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-text-0">{template.name}</p>
          <p className="text-[11px] text-text-3">key: {template.key}</p>
        </div>
        <span className="text-[11px] text-text-3">{template.is_active ? "Active" : "Disabled"}</span>
      </summary>
      <div className="border-t border-border p-4">
        <form action={formAction} className="flex flex-col gap-3">
          <div>
            <Label htmlFor={`subject-${template.id}`}>Subject</Label>
            <Input id={`subject-${template.id}`} name="subject" defaultValue={template.subject} required />
          </div>
          <div>
            <Label htmlFor={`body-${template.id}`}>Body (HTML)</Label>
            <Textarea
              id={`body-${template.id}`}
              name="body_html"
              defaultValue={template.body_html}
              required
              className="min-h-[160px] font-mono text-[12px]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_VARIABLES.map((v) => (
              <span key={v} className="rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-text-3">
                {v}
              </span>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-text-1">
            <input type="checkbox" name="is_active" defaultChecked={template.is_active} className="h-4 w-4 accent-[var(--accent)]" />
            Active (send this email automatically)
          </label>
          {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
          {state.success && <p className="text-[13px] text-success">Saved.</p>}
          <Button type="submit" disabled={pending} size="sm" className="self-start">
            {pending ? "Saving…" : "Save template"}
          </Button>
        </form>
      </div>
    </details>
  );
}
