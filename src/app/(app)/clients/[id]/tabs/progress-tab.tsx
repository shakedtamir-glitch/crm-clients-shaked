"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import type { ClientCheckin } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { addCheckinAction, type FormState } from "@/app/(app)/clients/actions";
import { formatDate } from "@/lib/utils";

const initialState: FormState = { error: null };

export function ProgressTab({ clientId, checkins }: { clientId: string; checkins: ClientCheckin[] }) {
  const action = addCheckinAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly check-ins</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Add check-in
            </Button>
          </DialogTrigger>
          <DialogContent title="Add weekly check-in">
            <form action={formAction} className="flex flex-col gap-3">
              <div>
                <Label htmlFor="week_of">Week of</Label>
                <Input id="week_of" name="week_of" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <Label htmlFor="skills">Current skills (comma-separated)</Label>
                <Input id="skills" name="skills" placeholder="Planche lean, Tuck front lever" />
              </div>
              <div>
                <Label htmlFor="goals_progress">Progress toward goals</Label>
                <Textarea id="goals_progress" name="goals_progress" />
              </div>
              <div>
                <Label htmlFor="video_urls">Video URLs (comma-separated)</Label>
                <Input id="video_urls" name="video_urls" placeholder="https://…" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <div>
                <Label htmlFor="coach_feedback">Coach feedback</Label>
                <Textarea id="coach_feedback" name="coach_feedback" />
              </div>
              {state.error && <p className="text-[13px] text-danger">{state.error}</p>}
              <Button type="submit" disabled={pending} className="justify-center">
                {pending ? "Saving…" : "Save check-in"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-4">
        {checkins.length === 0 && <p className="text-sm text-text-3">No check-ins logged yet.</p>}
        {checkins.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-text-0">Week of {formatDate(c.week_of)}</p>
            </div>
            {c.skills.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <Badge key={s} tone="accent">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {c.goals_progress && <p className="mb-1 text-[13px] text-text-1">{c.goals_progress}</p>}
            {c.coach_feedback && (
              <p className="mt-2 rounded-lg bg-surface-2 p-2.5 text-[13px] text-text-2">
                <span className="font-medium text-text-1">Coach feedback: </span>
                {c.coach_feedback}
              </p>
            )}
            {c.video_urls.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {c.video_urls.map((v) => (
                  <a key={v} href={v} target="_blank" rel="noreferrer" className="text-[12px] text-accent-strong hover:underline">
                    {v}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
