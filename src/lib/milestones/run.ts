import { parseISO, intervalToDuration, formatDuration, format } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGoogleAccess, createCalendarEvent } from "@/lib/google/calendar";
import { sendEmail } from "@/lib/email/resend";
import { milestoneEmailHtml } from "@/lib/email/milestone-email";
import { notifyAdmins } from "@/lib/notifications/create";
import type { ClientOverview } from "@/lib/supabase/types";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function totalTimeSince(startDate: string) {
  const duration = intervalToDuration({ start: parseISO(startDate), end: new Date() });
  const formatted = formatDuration(duration, { format: ["years", "months", "days"] });
  return formatted || "Less than a day";
}

export async function runMilestoneCheck() {
  const supabase = createAdminClient();

  const { data: overviewRaw } = await supabase.from("client_overview").select("*");
  const clients = (overviewRaw ?? []) as ClientOverview[];

  const dueClients = clients.filter(
    (c) =>
      c.status === "active" &&
      c.current_month != null &&
      (c.last_milestone_month == null || c.current_month > c.last_milestone_month)
  );

  if (dueClients.length === 0) {
    return { processed: 0, notified: [] as string[] };
  }

  const { data: admins } = await supabase.from("profiles").select("email").eq("role", "admin");
  const adminEmails = (admins ?? []).map((a) => a.email).filter((e): e is string => Boolean(e));

  const googleAccess = await getValidGoogleAccess(supabase).catch((err) => {
    console.error("Google Calendar access unavailable:", err);
    return null;
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const notified: string[] = [];

  for (const client of dueClients) {
    const month = client.current_month!;
    const profileUrl = `${appUrl()}/clients/${client.id}`;

    let emailSent = false;
    if (adminEmails.length > 0) {
      const result = await sendEmail({
        to: adminEmails,
        subject: `${client.full_name} has just entered Month ${month} of coaching`,
        html: milestoneEmailHtml({
          clientName: client.full_name,
          month,
          totalTime: client.start_date ? totalTimeSince(client.start_date) : "—",
          startDate: client.start_date ?? "—",
          program: client.program_type ?? "—",
          status: client.status,
          profileUrl,
        }),
      });
      emailSent = result.sent;
    }

    let calendarEventId: string | null = null;
    if (googleAccess) {
      calendarEventId = await createCalendarEvent(googleAccess.accessToken, googleAccess.calendarId, {
        summary: `${client.full_name} – Month ${month}`,
        description: [
          `Start Date: ${client.start_date ?? "—"}`,
          `Current Month: Month ${month}`,
          `Program: ${client.program_type ?? "—"}`,
          client.notes ? `Notes: ${client.notes}` : null,
          `CRM profile: ${profileUrl}`,
        ]
          .filter(Boolean)
          .join("\n"),
        date: today,
      });
    }

    await supabase.from("milestone_notifications").upsert(
      {
        client_id: client.id,
        month,
        email_sent: emailSent,
        calendar_event_id: calendarEventId,
      },
      { onConflict: "client_id,month" }
    );

    await supabase.from("clients").update({ last_milestone_month: month }).eq("id", client.id);

    await notifyAdmins(supabase, {
      type: "milestone",
      title: `${client.full_name} entered Month ${month}`,
      body: client.program_type ?? undefined,
      entityType: "client",
      entityId: client.id,
    });

    notified.push(`${client.full_name} → Month ${month}`);
  }

  return { processed: dueClients.length, notified };
}
