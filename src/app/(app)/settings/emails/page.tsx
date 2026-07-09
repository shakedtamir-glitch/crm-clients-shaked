import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "@/app/(app)/settings/emails/template-editor";
import type { EmailTemplate } from "@/lib/supabase/types";

export default async function EmailTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "admin") redirect("/settings");

  const { data: templates } = await supabase.from("email_templates").select("*").order("name");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/settings" className="flex items-center gap-1.5 text-[13px] text-text-2 hover:text-text-0">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-text-0">Email templates</h1>
        <p className="text-sm text-text-2">
          Edit the copy sent by every automated email. Use the variables shown under each editor.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {((templates ?? []) as EmailTemplate[]).map((t) => (
          <TemplateEditor key={t.id} template={t} />
        ))}
      </div>
    </div>
  );
}
