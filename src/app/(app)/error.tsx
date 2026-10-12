"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="mx-auto mt-10 max-w-xl p-6">
      <h1 className="text-lg font-semibold text-text-0">Something went wrong on this page</h1>
      <p className="mt-1 text-sm text-text-2">
        The page failed to render. The details below help pinpoint the cause.
      </p>

      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 text-[12px] text-text-1">
        {error.message || "Unknown error"}
      </pre>
      {error.digest && (
        <p className="mt-2 text-[12px] text-text-3">
          Error digest: <code>{error.digest}</code> (search your terminal / server logs for this id)
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    </Card>
  );
}
