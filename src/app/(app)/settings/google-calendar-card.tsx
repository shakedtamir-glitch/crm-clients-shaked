"use client";

import { useState, useTransition } from "react";
import { Calendar, PlayCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { disconnectGoogleAction, runDailyAutomationsAction } from "@/app/(app)/settings/actions";

export function GoogleCalendarCard({
  isConnected,
  connectedEmail,
}: {
  isConnected: boolean;
  connectedEmail: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [runResult, setRunResult] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar & background automation</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-0">
                {isConnected ? (connectedEmail ?? "Connected") : "Not connected"}
              </p>
              <p className="text-[12px] text-text-3">
                {isConnected
                  ? "Milestone events are created on this calendar."
                  : "Connect a Google account to auto-create milestone calendar events."}
              </p>
            </div>
          </div>
          {isConnected ? (
            <Badge tone="success">Connected</Badge>
          ) : (
            <a href="/api/google/connect">
              <Button size="sm">Connect Google Calendar</Button>
            </a>
          )}
        </div>

        {isConnected && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => startTransition(() => disconnectGoogleAction())}
            disabled={isPending}
          >
            Disconnect
          </Button>
        )}

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-[13px] text-text-2">
            Milestones, payment reminders/overdue notices, auto-archiving completed clients, and re-engagement
            emails all run automatically every day via cron. Trigger a check manually to test it now.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await runDailyAutomationsAction();
                setRunResult(result.error ?? result.summary ?? null);
              })
            }
          >
            <PlayCircle className="h-3.5 w-3.5" /> Run daily automations now
          </Button>
          {runResult && <p className="mt-2 text-[12px] text-text-2">{runResult}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
