import { Resend } from "resend";

let client: Resend | null | undefined;

/** Returns null (instead of throwing) when RESEND_API_KEY isn't configured yet. */
export function getResendClient(): Resend | null {
  if (client !== undefined) return client;
  const apiKey = process.env.RESEND_API_KEY;
  client = apiKey ? new Resend(apiKey) : null;
  if (!client) {
    console.warn("RESEND_API_KEY not set — emails will be skipped.");
  }
  return client;
}

export async function sendEmail(params: { to: string[]; subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend || params.to.length === 0) return { sent: false };

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    console.error("Resend send failed:", error);
    return { sent: false };
  }
  return { sent: true };
}
