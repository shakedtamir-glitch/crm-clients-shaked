import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityEntityType, Database } from "@/lib/supabase/types";

export async function logActivity(
  supabase: SupabaseClient<Database>,
  params: {
    entityType: ActivityEntityType;
    entityId: string;
    type: string;
    description: string;
    actorId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("activities").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    type: params.type,
    description: params.description,
    actor_id: params.actorId ?? null,
    metadata: params.metadata ?? {},
  });
}
