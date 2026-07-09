"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/supabase/types";

export type FormState = { error: string | null };

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Name is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateRoleAction(userId: string, role: ProfileRole) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/settings");
  return { error: error?.message ?? null };
}

export async function disconnectGoogleAction() {
  const supabase = await createClient();
  await supabase.from("google_calendar_connection").delete().gte("created_at", "1900-01-01");
  revalidatePath("/settings");
}

export async function runDailyAutomationsAction(): Promise<{ error: string | null; summary?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Admins only" };

  const { runDailyAutomations } = await import("@/lib/automations/daily");
  const result = await runDailyAutomations();

  revalidatePath("/dashboard");
  revalidatePath("/revenue");
  revalidatePath("/clients");
  return { error: null, summary: result.summary };
}
