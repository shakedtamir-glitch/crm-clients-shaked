"use client";

import { useActionState } from "react";
import type { ClientNote, Activity } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { addNoteAction, type FormState } from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";

const initialState: FormState = { error: null };

export function NotesTab({ clientId, notes, activities }: { clientId: string; notes: ClientNote[]; activities: Activity[] }) {
  const action = addNoteAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <form action={formAction} className="flex flex-col gap-2">
            <Textarea name="body" placeholder="Add a note…" required />
            {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
            <Button type="submit" disabled={pending} size="sm" className="self-end">
              {pending ? "Saving…" : "Add note"}
            </Button>
          </form>
          <div className="flex flex-col divide-y divide-border">
            {notes.length === 0 && <p className="text-sm text-text-3">No notes yet.</p>}
            {notes.map((n) => (
              <div key={n.id} className="py-3">
                <p className="whitespace-pre-wrap text-[13px] text-text-1">{n.body}</p>
                <p className="mt-1 text-[11px] text-text-3">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border pt-4">
          {activities.length === 0 && <p className="text-sm text-text-3">No activity yet.</p>}
          {activities.map((a) => (
            <div key={a.id} className="py-3">
              <p className="text-[13px] text-text-1">{a.description}</p>
              <p className="mt-1 text-[11px] text-text-3">{formatDate(a.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
