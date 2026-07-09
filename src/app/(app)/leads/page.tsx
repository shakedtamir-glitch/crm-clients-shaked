import { createClient } from "@/lib/supabase/server";
import { LeadsBoard } from "@/app/(app)/leads/board";
import { NewLeadDialog } from "@/app/(app)/leads/lead-form";
import type { Lead } from "@/lib/supabase/types";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase.from("leads").select("*").order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-0">Leads</h1>
          <p className="text-sm text-text-2">Drag cards between stages to update the pipeline.</p>
        </div>
        <NewLeadDialog />
      </div>

      <LeadsBoard initialLeads={(leads ?? []) as Lead[]} />
    </div>
  );
}
