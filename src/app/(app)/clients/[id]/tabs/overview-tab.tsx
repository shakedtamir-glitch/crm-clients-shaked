import type { ClientOverview } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-text-3">{label}</p>
      <p className="mt-0.5 text-[13px] text-text-0">{value ?? "—"}</p>
    </div>
  );
}

export function OverviewTab({ client }: { client: ClientOverview }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Personal information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Email" value={client.email} />
          <Field label="Phone" value={client.phone} />
          <Field label="Instagram" value={client.instagram} />
          <Field label="Country" value={client.country} />
          <Field label="Timezone" value={client.timezone} />
          <Field label="Age" value={client.age} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coaching information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Start date" value={client.start_date && formatDate(client.start_date)} />
          <Field label="End date" value={client.end_date && formatDate(client.end_date)} />
          <Field label="Program type" value={client.program_type} />
          <Field label="Current month" value={client.current_month ? `Month ${client.current_month}` : null} />
          <Field label="Status" value={client.status} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-[13px] text-text-1">{client.goals || "No goals set yet."}</p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-[13px] text-text-1">{client.notes || "No notes yet."}</p>
        </CardContent>
      </Card>
    </div>
  );
}
