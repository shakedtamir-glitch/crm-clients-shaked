"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { notifyAdmins } from "@/lib/notifications/create";
import type { LeadStage } from "@/lib/supabase/types";

export type FormState = { error: string | null };

const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New Lead",
  contacted: "Contacted",
  discovery_call: "Discovery Call",
  interested: "Interested",
  follow_up: "Follow-up",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

function toNullable(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  return s !== "" ? s : null;
}

const leadSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  instagram: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  estimated_value: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().nonnegative().optional()
  ),
  last_contact: z.string().optional().or(z.literal("")),
  next_follow_up: z.string().optional().or(z.literal("")),
});

export async function createLeadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: parsed.data.full_name,
      instagram: toNullable(formData.get("instagram")),
      email: toNullable(formData.get("email")),
      phone: toNullable(formData.get("phone")),
      country: toNullable(formData.get("country")),
      source: toNullable(formData.get("source")),
      notes: toNullable(formData.get("notes")),
      estimated_value: parsed.data.estimated_value ?? null,
      last_contact: toNullable(formData.get("last_contact")),
      next_follow_up: toNullable(formData.get("next_follow_up")),
      assigned_to: user?.id ?? null,
      stage: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create lead" };
  }

  await logActivity(supabase, {
    entityType: "lead",
    entityId: data.id,
    type: "created",
    description: `${parsed.data.full_name} added as a new lead`,
    actorId: user?.id,
  });

  await notifyAdmins(supabase, {
    type: "new_lead",
    title: `New lead: ${parsed.data.full_name}`,
    body: parsed.data.source || undefined,
    entityType: "lead",
    entityId: data.id,
  });

  revalidatePath("/leads");
  return { error: null };
}

export async function updateLeadStageAction(leadId: string, stage: LeadStage) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead, error } = await supabase
    .from("leads")
    .update({ stage })
    .eq("id", leadId)
    .select("full_name")
    .single();

  if (error || !lead) return;

  await logActivity(supabase, {
    entityType: "lead",
    entityId: leadId,
    type: "stage_changed",
    description: `${lead.full_name} moved to ${STAGE_LABELS[stage]}`,
    actorId: user?.id,
    metadata: { stage },
  });

  revalidatePath("/leads");
}

export async function deleteLeadAction(leadId: string) {
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", leadId);
  revalidatePath("/leads");
}

export async function convertLeadToClientAction(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return;

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      instagram: lead.instagram,
      country: lead.country,
      status: "active",
      start_date: new Date().toISOString().slice(0, 10),
      notes: lead.notes,
      tags: ["Lead"],
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !client) return;

  await supabase.from("leads").update({ stage: "closed_won", converted_client_id: client.id }).eq("id", leadId);

  await logActivity(supabase, {
    entityType: "lead",
    entityId: leadId,
    type: "converted",
    description: `${lead.full_name} converted to a client`,
    actorId: user?.id,
    metadata: { client_id: client.id },
  });
  await logActivity(supabase, {
    entityType: "client",
    entityId: client.id,
    type: "created",
    description: `${lead.full_name} created from a converted lead`,
    actorId: user?.id,
  });

  revalidatePath("/leads");
  revalidatePath("/clients");
}
