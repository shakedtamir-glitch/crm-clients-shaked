import { parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplateEmail } from "@/lib/email/send-template";
import { getCoachName } from "@/lib/email/variables";
import { logActivity } from "@/lib/activity";
import { notifyAdmins } from "@/lib/notifications/create";
import type { ClientOverview, ClientCheckin, Communication } from "@/lib/supabase/types";

const REENGAGEMENT_COOLDOWN_DAYS = 30;
const INACTIVITY_THRESHOLD_DAYS = 30;

async function buildVariables(supabase: ReturnType<typeof createAdminClient>, client: ClientOverview) {
  const coachName = await getCoachName(supabase, client.coach_id);
  return {
    ClientName: client.full_name,
    CurrentMonth: client.current_month != null ? `Month ${client.current_month}` : "",
    Program: client.program_type ?? "",
    CoachName: coachName ?? "Your coach",
    PaymentAmount: "",
    NextPaymentDate: "",
  };
}

export async function runLifecycleAutomations() {
  const supabase = createAdminClient();
  const today = new Date();

  const { data: overviewRaw } = await supabase.from("client_overview").select("*");
  const clients = (overviewRaw ?? []) as ClientOverview[];

  let completions = 0;
  let reengagements = 0;

  // Auto-archive clients whose coaching has ended
  for (const client of clients) {
    if (client.status !== "active" || !client.end_date || client.completion_email_sent) continue;
    if (parseISO(client.end_date) > today) continue;

    const variables = await buildVariables(supabase, client);
    const result = await sendTemplateEmail(supabase, {
      templateKey: "coaching_completion",
      to: client.email ? [client.email] : [],
      clientId: client.id,
      variables,
    });

    await supabase
      .from("clients")
      .update({ status: "ended", completion_email_sent: result.sent })
      .eq("id", client.id);

    await logActivity(supabase, {
      entityType: "client",
      entityId: client.id,
      type: "auto_archived",
      description: `${client.full_name} automatically marked as ended (coaching end date reached)`,
    });

    await notifyAdmins(supabase, {
      type: "coaching_completed",
      title: `${client.full_name} completed coaching`,
      entityType: "client",
      entityId: client.id,
    });

    completions += 1;
  }

  // Re-engagement: active clients with no recent check-ins or communication
  const activeIds = clients.filter((c) => c.status === "active").map((c) => c.id);
  if (activeIds.length === 0) return { completions, reengagements };

  const [{ data: checkinsRaw }, { data: commsRaw }] = await Promise.all([
    supabase.from("client_checkins").select("client_id, created_at").in("client_id", activeIds),
    supabase.from("communications").select("client_id, occurred_at").in("client_id", activeIds),
  ]);

  const lastActivity = new Map<string, number>();
  for (const c of clients) {
    if (c.status === "active") lastActivity.set(c.id, parseISO(c.created_at).getTime());
  }
  for (const row of (checkinsRaw ?? []) as Pick<ClientCheckin, "client_id" | "created_at">[]) {
    const t = new Date(row.created_at).getTime();
    lastActivity.set(row.client_id, Math.max(lastActivity.get(row.client_id) ?? 0, t));
  }
  for (const row of (commsRaw ?? []) as Pick<Communication, "client_id" | "occurred_at">[]) {
    const t = new Date(row.occurred_at).getTime();
    lastActivity.set(row.client_id, Math.max(lastActivity.get(row.client_id) ?? 0, t));
  }

  const inactivityCutoff = today.getTime() - INACTIVITY_THRESHOLD_DAYS * 86400000;
  const cooldownCutoff = today.getTime() - REENGAGEMENT_COOLDOWN_DAYS * 86400000;

  for (const client of clients) {
    if (client.status !== "active" || client.completion_email_sent) continue;
    const last = lastActivity.get(client.id) ?? 0;
    if (last > inactivityCutoff) continue;

    const lastSent = client.last_reengagement_sent_at ? new Date(client.last_reengagement_sent_at).getTime() : 0;
    if (lastSent > cooldownCutoff) continue;

    const variables = await buildVariables(supabase, client);
    const result = await sendTemplateEmail(supabase, {
      templateKey: "re_engagement",
      to: client.email ? [client.email] : [],
      clientId: client.id,
      variables,
    });

    if (result.sent) {
      await supabase.from("clients").update({ last_reengagement_sent_at: today.toISOString() }).eq("id", client.id);
      await notifyAdmins(supabase, {
        type: "client_inactive",
        title: `${client.full_name} has gone quiet`,
        body: "No check-ins or messages in 30+ days",
        entityType: "client",
        entityId: client.id,
      });
      reengagements += 1;
    }
  }

  return { completions, reengagements };
}
