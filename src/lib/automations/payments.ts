import { addDays, parseISO } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTemplateEmail } from "@/lib/email/send-template";
import { getCoachName } from "@/lib/email/variables";
import { notifyAdmins } from "@/lib/notifications/create";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClientOverview, Payment } from "@/lib/supabase/types";

export async function runPaymentAutomations() {
  const supabase = createAdminClient();

  const [{ data: paymentsRaw }, { data: clientsRaw }] = await Promise.all([
    supabase.from("payments").select("*").in("status", ["pending", "overdue"]),
    supabase.from("client_overview").select("*"),
  ]);

  const payments = (paymentsRaw ?? []) as Payment[];
  const clients = new Map(((clientsRaw ?? []) as ClientOverview[]).map((c) => [c.id, c]));

  const today = new Date();
  const reminderCutoff = addDays(today, 3);

  let remindersSent = 0;
  let overdueSent = 0;

  for (const payment of payments) {
    if (!payment.due_date) continue;
    const client = clients.get(payment.client_id);
    if (!client) continue;

    const dueDate = parseISO(payment.due_date);
    const isOverdue = dueDate < today;
    const coachName = await getCoachName(supabase, client.coach_id);

    const baseVariables = {
      ClientName: client.full_name,
      CurrentMonth: client.current_month != null ? `Month ${client.current_month}` : "",
      Program: client.program_type ?? "",
      CoachName: coachName ?? "Your coach",
      PaymentAmount: formatCurrency(Number(payment.amount), payment.currency),
      NextPaymentDate: formatDate(payment.due_date),
    };

    if (isOverdue && !payment.overdue_reminder_sent) {
      const result = await sendTemplateEmail(supabase, {
        templateKey: "payment_overdue",
        to: client.email ? [client.email] : [],
        clientId: client.id,
        variables: baseVariables,
      });
      await supabase
        .from("payments")
        .update({ overdue_reminder_sent: true, status: payment.status === "pending" ? "overdue" : payment.status })
        .eq("id", payment.id);
      await notifyAdmins(supabase, {
        type: "payment_overdue",
        title: `${client.full_name}'s payment is overdue`,
        body: baseVariables.PaymentAmount,
        entityType: "client",
        entityId: client.id,
      });
      if (result.sent) overdueSent += 1;
    } else if (!isOverdue && dueDate <= reminderCutoff && !payment.due_reminder_sent) {
      const result = await sendTemplateEmail(supabase, {
        templateKey: "payment_reminder",
        to: client.email ? [client.email] : [],
        clientId: client.id,
        variables: baseVariables,
      });
      await supabase.from("payments").update({ due_reminder_sent: true }).eq("id", payment.id);
      await notifyAdmins(supabase, {
        type: "payment_due_soon",
        title: `${client.full_name}'s payment is due soon`,
        body: baseVariables.PaymentAmount,
        entityType: "client",
        entityId: client.id,
      });
      if (result.sent) remindersSent += 1;
    }
  }

  return { remindersSent, overdueSent };
}
