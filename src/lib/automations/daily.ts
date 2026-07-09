import { runMilestoneCheck } from "@/lib/milestones/run";
import { runPaymentAutomations } from "@/lib/automations/payments";
import { runLifecycleAutomations } from "@/lib/automations/lifecycle";

export async function runDailyAutomations() {
  const [milestones, payments, lifecycle] = await Promise.all([
    runMilestoneCheck(),
    runPaymentAutomations(),
    runLifecycleAutomations(),
  ]);

  const summaryParts = [
    milestones.processed > 0 ? `${milestones.processed} milestone(s): ${milestones.notified.join(", ")}` : null,
    payments.remindersSent > 0 ? `${payments.remindersSent} payment reminder(s) sent` : null,
    payments.overdueSent > 0 ? `${payments.overdueSent} overdue notice(s) sent` : null,
    lifecycle.completions > 0 ? `${lifecycle.completions} client(s) marked complete` : null,
    lifecycle.reengagements > 0 ? `${lifecycle.reengagements} re-engagement email(s) sent` : null,
  ].filter(Boolean);

  return {
    milestones,
    payments,
    lifecycle,
    summary: summaryParts.length > 0 ? summaryParts.join(" · ") : "Nothing to do — everything is up to date.",
  };
}
