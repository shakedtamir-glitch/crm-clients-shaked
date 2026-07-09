import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EmailTemplateKey } from "@/lib/supabase/types";
import { sendEmail } from "@/lib/email/resend";
import { renderTemplate } from "@/lib/email/templates";

export async function sendTemplateEmail(
  supabase: SupabaseClient<Database>,
  params: {
    templateKey: EmailTemplateKey | string;
    to: string[];
    variables: Record<string, string>;
    clientId?: string | null;
  }
): Promise<{ sent: boolean }> {
  const { data: template } = await supabase
    .from("email_templates")
    .select("*")
    .eq("key", params.templateKey)
    .eq("is_active", true)
    .maybeSingle();

  if (!template || params.to.length === 0) {
    return { sent: false };
  }

  const subject = renderTemplate(template.subject, params.variables);
  const html = renderTemplate(template.body_html, params.variables);

  const result = await sendEmail({ to: params.to, subject, html });

  const { error: logError } = await supabase.from("email_log").insert({
    client_id: params.clientId ?? null,
    template_key: params.templateKey,
    subject,
    status: result.sent ? "sent" : "skipped",
  });
  if (logError) {
    console.error(`Failed to write email_log for template "${params.templateKey}":`, logError.message);
  }

  return result;
}
