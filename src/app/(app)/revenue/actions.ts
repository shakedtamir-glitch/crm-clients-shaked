"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { sendTemplateEmail } from "@/lib/email/send-template";
import { getCoachName } from "@/lib/email/variables";
import { formatCurrency } from "@/lib/utils";
import type { ClientOverview } from "@/lib/supabase/types";

export async function markPaymentPaidAction(paymentId: string, clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: payment, error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", paymentId)
    .select("amount, currency, thank_you_sent")
    .single();

  if (error || !payment) {
    revalidatePath("/revenue");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");
    return;
  }

  await logActivity(supabase, {
    entityType: "payment",
    entityId: paymentId,
    type: "payment_marked_paid",
    description: "Payment marked as paid",
    actorId: user?.id,
    metadata: { client_id: clientId },
  });

  if (!payment.thank_you_sent) {
    const { data: client } = await supabase.from("client_overview").select("*").eq("id", clientId).single();
    if (client) {
      const coachName = await getCoachName(supabase, (client as ClientOverview).coach_id);
      const sent = await sendTemplateEmail(supabase, {
        templateKey: "payment_thank_you",
        to: client.email ? [client.email] : [],
        clientId,
        variables: {
          ClientName: client.full_name,
          CurrentMonth: client.current_month != null ? `Month ${client.current_month}` : "",
          Program: client.program_type ?? "",
          CoachName: coachName ?? "Your coach",
          PaymentAmount: formatCurrency(Number(payment.amount), payment.currency),
          NextPaymentDate: client.next_payment_date ? client.next_payment_date : "",
        },
      });
      if (sent.sent) {
        await supabase.from("payments").update({ thank_you_sent: true }).eq("id", paymentId);
      }
    }
  }

  revalidatePath("/revenue");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}
