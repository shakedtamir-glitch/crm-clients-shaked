import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function notifyAdmins(
  supabase: SupabaseClient<Database>,
  params: { type: string; title: string; body?: string; entityType?: string; entityId?: string }
) {
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  const rows = (admins ?? []).map((a) => ({
    user_id: a.id,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  }));
  if (rows.length > 0) {
    await supabase.from("notifications").insert(rows);
  }
}
