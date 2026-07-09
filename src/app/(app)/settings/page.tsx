import Link from "next/link";
import { Mail, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/app/(app)/settings/profile-form";
import { TeamTable } from "@/app/(app)/settings/team-table";
import { GoogleCalendarCard } from "@/app/(app)/settings/google-calendar-card";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: members }, { data: googleConnection }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("google_calendar_connection").select("id, connected_email").maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-0">Settings</h1>
        <p className="text-sm text-text-2">Manage your profile and team.</p>
      </div>

      <ProfileForm fullName={profile?.full_name ?? ""} email={user?.email ?? ""} />

      <TeamTable members={(members ?? []) as Profile[]} isAdmin={isAdmin} currentUserId={user!.id} />

      {isAdmin && (
        <GoogleCalendarCard isConnected={Boolean(googleConnection)} connectedEmail={googleConnection?.connected_email ?? null} />
      )}

      {isAdmin && (
        <Link href="/settings/emails">
          <Card className="flex items-center justify-between p-5 transition-colors hover:bg-surface-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-text-0">Email templates</p>
                <p className="text-[12px] text-text-3">Edit the copy for every automated email</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-text-3" />
          </Card>
        </Link>
      )}
    </div>
  );
}
