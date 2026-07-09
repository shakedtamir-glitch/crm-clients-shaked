"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

export type FormState = { error: string | null };

function toNullable(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  return s !== "" ? s : null;
}

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["client_call", "discovery_call", "check_in", "follow_up", "other"]).default("other"),
  starts_at: z.string().min(1, "Date/time is required"),
  client_id: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function createEventAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      title: parsed.data.title,
      type: parsed.data.type,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      client_id: toNullable(formData.get("client_id")),
      notes: toNullable(formData.get("notes")),
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create event" };
  }

  const clientId = toNullable(formData.get("client_id"));
  if (clientId) {
    await logActivity(supabase, {
      entityType: "client",
      entityId: clientId,
      type: "event_scheduled",
      description: `Event "${parsed.data.title}" scheduled`,
      actorId: user?.id,
    });
  }

  revalidatePath("/calendar");
  return { error: null };
}

export async function deleteEventAction(eventId: string) {
  const supabase = await createClient();
  await supabase.from("calendar_events").delete().eq("id", eventId);
  revalidatePath("/calendar");
}
