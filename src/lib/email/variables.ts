import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ClientOverview, Database } from "@/lib/supabase/types";

export async function getCoachName(supabase: SupabaseClient<Database>, coachId: string | null) {
  if (!coachId) return null;
  const { data } = await supabase.from("profiles").select("full_name").eq("id", coachId).maybeSingle();
  return data?.full_name ?? null;
}

/** The standard {{variable}} set available to every email template. */
export function buildClientVariables(
  client: ClientOverview,
  extra?: { coachName?: string | null; paymentAmount?: number; paymentCurrency?: string }
): Record<string, string> {
  const amount = extra?.paymentAmount ?? (client.payment_amount != null ? Number(client.payment_amount) : null);
  const currency = extra?.paymentCurrency ?? client.payment_currency;

  return {
    ClientName: client.full_name,
    CurrentMonth: client.current_month != null ? `Month ${client.current_month}` : "",
    Program: client.program_type ?? "",
    CoachName: extra?.coachName ?? "Your coach",
    PaymentAmount: amount != null ? formatCurrency(amount, currency) : "",
    NextPaymentDate: client.next_payment_date ? formatDate(client.next_payment_date) : "",
  };
}
