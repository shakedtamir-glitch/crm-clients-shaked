"use server";

import { z } from "zod";
import { addMonths, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";
import { sendTemplateEmail } from "@/lib/email/send-template";
import { getCoachName } from "@/lib/email/variables";
import { formatCurrency, formatDate } from "@/lib/utils";

export type FormState = { error: string | null };

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);
const optionalPositiveNumber = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());
const optionalNonnegativeNumber = z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional());

const clientSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  age: optionalPositiveNumber,
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  program_type: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "paused", "ended"]).default("active"),
  goals: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  payment_amount: optionalNonnegativeNumber,
  payment_currency: z.string().optional().or(z.literal("")),
  payment_frequency: z.enum(["weekly", "monthly", "quarterly", "yearly", "one_time"]).optional(),
  next_payment_date: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
  coach_id: z.string().optional().or(z.literal("")),
});

function toNullable(value: string | undefined) {
  return value && value.trim() !== "" ? value : null;
}

function parseClientForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = clientSchema.parse(raw);

  return {
    full_name: parsed.full_name,
    email: toNullable(parsed.email),
    phone: toNullable(parsed.phone),
    instagram: toNullable(parsed.instagram),
    country: toNullable(parsed.country),
    timezone: toNullable(parsed.timezone),
    age: parsed.age ?? null,
    start_date: toNullable(parsed.start_date),
    end_date: toNullable(parsed.end_date),
    program_type: toNullable(parsed.program_type),
    status: parsed.status,
    goals: toNullable(parsed.goals),
    notes: toNullable(parsed.notes),
    payment_amount: parsed.payment_amount ?? null,
    payment_currency: toNullable(parsed.payment_currency) ?? "USD",
    payment_frequency: parsed.payment_frequency ?? null,
    next_payment_date: toNullable(parsed.next_payment_date),
    tags: parsed.tags
      ? parsed.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    coach_id: toNullable(parsed.coach_id),
  };
}

export async function createClientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let values: ReturnType<typeof parseClientForm>;
  try {
    values = parseClientForm(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...values, coach_id: values.coach_id ?? user?.id ?? null, created_by: user?.id ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create client" };
  }

  await logActivity(supabase, {
    entityType: "client",
    entityId: data.id,
    type: "created",
    description: `${values.full_name} added as a new client`,
    actorId: user?.id,
  });

  await provisionNewClient(supabase, {
    clientId: data.id,
    fullName: values.full_name,
    email: values.email,
    program: values.program_type,
    coachId: values.coach_id ?? user?.id ?? null,
    paymentAmount: values.payment_amount,
    paymentCurrency: values.payment_currency,
    nextPaymentDate: values.next_payment_date,
  });

  revalidatePath("/clients");
  revalidatePath("/tasks");
  redirect(`/clients/${data.id}`);
}

/**
 * Everything a brand-new client needs with zero manual setup: a welcome
 * email and the standard onboarding/follow-up tasks. Milestones, dashboard
 * stats, analytics, search, and filters all pick the client up automatically
 * on their next read — they're live queries, not cached state to refresh.
 */
async function provisionNewClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    clientId: string;
    fullName: string;
    email: string | null;
    program: string | null;
    coachId: string | null;
    paymentAmount: number | null;
    paymentCurrency: string;
    nextPaymentDate: string | null;
  }
) {
  const coachName = await getCoachName(supabase, params.coachId);

  if (params.email) {
    await sendTemplateEmail(supabase, {
      templateKey: "welcome",
      to: [params.email],
      clientId: params.clientId,
      variables: {
        ClientName: params.fullName,
        CurrentMonth: "Month 1",
        Program: params.program ?? "",
        CoachName: coachName ?? "Your coach",
        PaymentAmount: params.paymentAmount != null ? formatCurrency(params.paymentAmount, params.paymentCurrency) : "",
        NextPaymentDate: params.nextPaymentDate ? formatDate(params.nextPaymentDate) : "",
      },
    });
  }

  const now = Date.now();
  await supabase.from("tasks").insert([
    {
      title: `Send onboarding info to ${params.fullName}`,
      priority: "medium",
      client_id: params.clientId,
      assigned_to: params.coachId,
      due_date: new Date(now + 2 * 86400000).toISOString(),
    },
    {
      title: `Follow up with ${params.fullName} after first week`,
      priority: "medium",
      client_id: params.clientId,
      assigned_to: params.coachId,
      due_date: new Date(now + 7 * 86400000).toISOString(),
    },
  ]);
}

export async function updateClientAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  let values: ReturnType<typeof parseClientForm>;
  try {
    values = parseClientForm(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("clients").update(values).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logActivity(supabase, {
    entityType: "client",
    entityId: id,
    type: "updated",
    description: `${values.full_name}'s profile was updated`,
    actorId: user?.id,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/clients");
  redirect("/clients");
}

const renewSchema = z.object({
  months: z.coerce.number().int().positive().max(60).default(6),
});

/**
 * Renew a client's coaching: extends the end date by `months` and records the
 * renewal as a `renewed` activity. The count of those activities is how the
 * system "remembers" how many times a client renewed — no schema change needed,
 * and each renewal keeps its own history (months + old/new end date) in metadata.
 */
export async function renewClientAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = renewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { months } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("full_name, end_date")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return { error: fetchError?.message ?? "Client not found" };
  }

  // Extend from the current end date when it's still in the future, otherwise
  // from today — so renewing an already-lapsed client never back-dates the end.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentEnd = client.end_date ? parseISO(client.end_date) : null;
  const base = currentEnd && currentEnd > today ? currentEnd : today;
  const newEnd = addMonths(base, months);
  const newEndStr = format(newEnd, "yyyy-MM-dd");

  const { error } = await supabase
    .from("clients")
    .update({ end_date: newEndStr, status: "active" })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logActivity(supabase, {
    entityType: "client",
    entityId: id,
    type: "renewed",
    description: `Coaching renewed for ${months} month${months === 1 ? "" : "s"} — now through ${format(newEnd, "MMM d, yyyy")}`,
    actorId: user?.id,
    metadata: { months, previous_end_date: client.end_date, new_end_date: newEndStr },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { error: null };
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(1).default("USD"),
  status: z.enum(["paid", "pending", "overdue", "refunded"]).default("pending"),
  method: z.enum(["card", "paypal", "bank_transfer", "crypto", "other"]).optional(),
  due_date: z.string().optional().or(z.literal("")),
  paid_date: z.string().optional().or(z.literal("")),
  invoice_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function addPaymentAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    status: parsed.data.status,
    method: parsed.data.method,
    due_date: toNullable(parsed.data.due_date),
    paid_date: toNullable(parsed.data.paid_date),
    invoice_number: toNullable(parsed.data.invoice_number),
    notes: toNullable(parsed.data.notes),
    created_by: user?.id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  await logActivity(supabase, {
    entityType: "client",
    entityId: clientId,
    type: "payment_recorded",
    description: `Payment of ${parsed.data.amount} ${parsed.data.currency} recorded (${parsed.data.status})`,
    actorId: user?.id,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function addNoteAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Note cannot be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("client_notes").insert({
    client_id: clientId,
    author_id: user?.id ?? null,
    body,
  });

  if (error) return { error: error.message };

  await logActivity(supabase, {
    entityType: "client",
    entityId: clientId,
    type: "note_added",
    description: "Note added",
    actorId: user?.id,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

const checkinSchema = z.object({
  week_of: z.string().min(1, "Week is required"),
  skills: z.string().optional().or(z.literal("")),
  goals_progress: z.string().optional().or(z.literal("")),
  video_urls: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  coach_feedback: z.string().optional().or(z.literal("")),
});

export async function addCheckinAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = checkinSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const toList = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

  const { error } = await supabase.from("client_checkins").insert({
    client_id: clientId,
    week_of: parsed.data.week_of,
    skills: toList(parsed.data.skills),
    goals_progress: toNullable(parsed.data.goals_progress),
    video_urls: toList(parsed.data.video_urls),
    notes: toNullable(parsed.data.notes),
    coach_feedback: toNullable(parsed.data.coach_feedback),
  });

  if (error) return { error: error.message };

  await logActivity(supabase, {
    entityType: "client",
    entityId: clientId,
    type: "checkin_added",
    description: "Weekly check-in logged",
    actorId: user?.id,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

function attachmentTypeFromMime(mime: string): "pdf" | "video" | "image" | "document" {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return "document";
}

export async function uploadAttachmentAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = `${clientId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file, {
    contentType: file.type || undefined,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { error } = await supabase.from("client_attachments").insert({
    client_id: clientId,
    file_name: file.name,
    file_path: path,
    file_type: attachmentTypeFromMime(file.type),
    size_bytes: file.size,
    uploaded_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  await logActivity(supabase, {
    entityType: "client",
    entityId: clientId,
    type: "attachment_uploaded",
    description: `File "${file.name}" uploaded`,
    actorId: user?.id,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function deleteAttachmentAction(clientId: string, attachmentId: string, filePath: string) {
  const supabase = await createClient();
  await supabase.storage.from("attachments").remove([filePath]);
  await supabase.from("client_attachments").delete().eq("id", attachmentId);
  revalidatePath(`/clients/${clientId}`);
}

const communicationSchema = z.object({
  type: z.enum(["email", "message", "call"]),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  subject: z.string().optional().or(z.literal("")),
  body: z.string().optional().or(z.literal("")),
});

export async function addCommunicationAction(
  clientId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = communicationSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("communications").insert({
    client_id: clientId,
    type: parsed.data.type,
    direction: parsed.data.direction,
    subject: toNullable(parsed.data.subject),
    body: toNullable(parsed.data.body),
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  await logActivity(supabase, {
    entityType: "client",
    entityId: clientId,
    type: "communication_logged",
    description: `${parsed.data.type} logged (${parsed.data.direction})`,
    actorId: user?.id,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}

export async function sendClientEmailAction(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const templateKey = String(formData.get("template_key") ?? "");
  if (!templateKey) return { error: "Choose a template" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: client } = await supabase.from("client_overview").select("*").eq("id", clientId).single();
  if (!client) return { error: "Client not found" };
  if (!client.email) return { error: "This client has no email address on file" };

  const coachName = await getCoachName(supabase, client.coach_id);

  const result = await sendTemplateEmail(supabase, {
    templateKey,
    to: [client.email],
    clientId,
    variables: {
      ClientName: client.full_name,
      CurrentMonth: client.current_month != null ? `Month ${client.current_month}` : "",
      Program: client.program_type ?? "",
      CoachName: coachName ?? "Your coach",
      PaymentAmount: client.payment_amount != null ? formatCurrency(Number(client.payment_amount), client.payment_currency) : "",
      NextPaymentDate: client.next_payment_date ? formatDate(client.next_payment_date) : "",
    },
  });

  if (!result.sent) {
    return { error: "Email not configured or failed to send — check RESEND_API_KEY." };
  }

  await supabase.from("communications").insert({
    client_id: clientId,
    type: "email",
    direction: "outbound",
    subject: `Sent: ${templateKey.replace(/_/g, " ")}`,
    created_by: user?.id ?? null,
  });

  revalidatePath(`/clients/${clientId}`);
  return { error: null };
}
