import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientHeader } from "@/app/(app)/clients/[id]/client-header";
import { OverviewTab } from "@/app/(app)/clients/[id]/tabs/overview-tab";
import { PaymentsTab } from "@/app/(app)/clients/[id]/tabs/payments-tab";
import { ProgressTab } from "@/app/(app)/clients/[id]/tabs/progress-tab";
import { CommunicationTab } from "@/app/(app)/clients/[id]/tabs/communication-tab";
import { AttachmentsTab, type AttachmentWithUrl } from "@/app/(app)/clients/[id]/tabs/attachments-tab";
import { NotesTab } from "@/app/(app)/clients/[id]/tabs/notes-tab";
import type { ClientOverview } from "@/lib/supabase/types";

export default async function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: client, error: clientError },
    { data: payments },
    { data: checkins },
    { data: communications },
    { data: attachments },
    { data: notes },
    { data: activities },
    { data: coaches },
    { data: templates },
  ] = await Promise.all([
    supabase.from("client_overview").select("*").eq("id", id).single(),
    supabase.from("payments").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("client_checkins").select("*").eq("client_id", id).order("week_of", { ascending: false }),
    supabase.from("communications").select("*").eq("client_id", id).order("occurred_at", { ascending: false }),
    supabase.from("client_attachments").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("client_notes").select("*").eq("client_id", id).order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("email_templates").select("*").eq("is_active", true).order("name"),
  ]);

  // `.single()` returns PGRST116 when the row genuinely doesn't exist — that's
  // a real 404. Any other error (RLS, a failing view, a transient DB error)
  // must surface as an error, not be masked as "page not found".
  if (clientError && clientError.code !== "PGRST116") {
    throw new Error(`Failed to load client: ${clientError.message}`);
  }
  if (!client) notFound();

  const { count: renewalCount } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "client")
    .eq("entity_id", id)
    .eq("type", "renewed");

  const attachmentsWithUrls: AttachmentWithUrl[] = await Promise.all(
    (attachments ?? []).map(async (a) => {
      const { data: signed } = await supabase.storage.from("attachments").createSignedUrl(a.file_path, 3600);
      return { ...a, url: signed?.signedUrl ?? null };
    })
  );

  return (
    <div className="flex flex-col gap-6">
      <ClientHeader client={client as ClientOverview} coaches={coaches ?? []} renewalCount={renewalCount ?? 0} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab client={client as ClientOverview} />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentsTab clientId={id} payments={payments ?? []} />
        </TabsContent>
        <TabsContent value="progress">
          <ProgressTab clientId={id} checkins={checkins ?? []} />
        </TabsContent>
        <TabsContent value="communication">
          <CommunicationTab clientId={id} communications={communications ?? []} templates={templates ?? []} />
        </TabsContent>
        <TabsContent value="attachments">
          <AttachmentsTab clientId={id} attachments={attachmentsWithUrls} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab clientId={id} notes={notes ?? []} activities={activities ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
