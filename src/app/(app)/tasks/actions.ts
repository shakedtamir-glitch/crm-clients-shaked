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

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due_date: z.string().optional().or(z.literal("")),
  reminder_at: z.string().optional().or(z.literal("")),
  client_id: z.string().optional().or(z.literal("")),
  lead_id: z.string().optional().or(z.literal("")),
});

export async function createTaskAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: parsed.data.title,
      description: toNullable(formData.get("description")),
      priority: parsed.data.priority,
      due_date: toNullable(formData.get("due_date")),
      reminder_at: toNullable(formData.get("reminder_at")),
      client_id: toNullable(formData.get("client_id")),
      lead_id: toNullable(formData.get("lead_id")),
      assigned_to: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create task" };
  }

  await logActivity(supabase, {
    entityType: "task",
    entityId: data.id,
    type: "created",
    description: `Task "${parsed.data.title}" created`,
    actorId: user?.id,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function toggleTaskCompleteAction(taskId: string, completed: boolean) {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
