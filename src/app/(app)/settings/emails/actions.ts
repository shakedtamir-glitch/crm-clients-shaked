"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null; success?: boolean };

export async function updateEmailTemplateAction(
  templateId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("body_html") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!subject || !bodyHtml) {
    return { error: "Subject and body are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("email_templates")
    .update({ subject, body_html: bodyHtml, is_active: isActive })
    .eq("id", templateId);

  if (error) return { error: error.message };

  revalidatePath("/settings/emails");
  return { error: null, success: true };
}
