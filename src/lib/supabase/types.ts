// Hand-written to match supabase/migrations/0001_init.sql.
// If you modify the schema, run `supabase gen types typescript` against your
// project and replace this file to keep it authoritative.
//
// NOTE: these are `type` aliases (not `interface`s) on purpose — TypeScript
// only grants object type literals an implicit index signature, which
// @supabase/supabase-js's generic `Database` constraint (`Record<string,
// unknown>`) requires. Interfaces don't get one and silently resolve to
// `never` throughout the client.

export type ProfileRole = "admin" | "coach";
export type ClientStatus = "active" | "paused" | "ended";
export type PaymentFrequency = "weekly" | "monthly" | "quarterly" | "yearly" | "one_time";
export type PaymentStatus = "paid" | "pending" | "overdue" | "refunded";
export type PaymentMethod = "card" | "paypal" | "bank_transfer" | "crypto" | "other";
export type AttachmentType = "pdf" | "video" | "image" | "document";
export type CommunicationType = "email" | "message" | "call";
export type CommunicationDirection = "inbound" | "outbound";
export type LeadStage =
  | "new"
  | "contacted"
  | "discovery_call"
  | "interested"
  | "follow_up"
  | "closed_won"
  | "closed_lost";
export type ActivityEntityType = "client" | "lead" | "payment" | "task";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  created_at: string;
};

export type Client = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  country: string | null;
  timezone: string | null;
  age: number | null;
  avatar_url: string | null;
  start_date: string | null;
  end_date: string | null;
  program_type: string | null;
  status: ClientStatus;
  goals: string | null;
  notes: string | null;
  payment_amount: number | null;
  payment_currency: string;
  payment_frequency: PaymentFrequency | null;
  next_payment_date: string | null;
  tags: string[];
  created_by: string | null;
  coach_id: string | null;
  last_milestone_month: number | null;
  completion_email_sent: boolean;
  last_reengagement_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientOverview = Client & {
  current_month: number | null;
  payment_overdue: boolean;
  payment_due_soon: boolean;
  coaching_ending_soon: boolean;
};

export type Payment = {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  due_date: string | null;
  paid_date: string | null;
  invoice_number: string | null;
  notes: string | null;
  due_reminder_sent: boolean;
  overdue_reminder_sent: boolean;
  thank_you_sent: boolean;
  created_by: string | null;
  created_at: string;
};

export type ClientNote = {
  id: string;
  client_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type ClientCheckin = {
  id: string;
  client_id: string;
  week_of: string;
  skills: string[];
  goals_progress: string | null;
  video_urls: string[];
  notes: string | null;
  coach_feedback: string | null;
  created_at: string;
};

export type ClientAttachment = {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_type: AttachmentType;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type Communication = {
  id: string;
  client_id: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  created_by: string | null;
  created_at: string;
};

export type Lead = {
  id: string;
  full_name: string;
  instagram: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  source: string | null;
  notes: string | null;
  stage: LeadStage;
  estimated_value: number | null;
  last_contact: string | null;
  next_follow_up: string | null;
  assigned_to: string | null;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  entity_type: ActivityEntityType;
  entity_id: string;
  type: string;
  description: string;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  reminder_at: string | null;
  client_id: string | null;
  lead_id: string | null;
  assigned_to: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type CalendarEventType = "client_call" | "discovery_call" | "check_in" | "follow_up" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  client_id: string | null;
  lead_id: string | null;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type GoogleCalendarConnection = {
  id: string;
  connected_by: string | null;
  connected_email: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_id: string;
  created_at: string;
  updated_at: string;
};

export type MilestoneNotification = {
  id: string;
  client_id: string;
  month: number;
  notified_at: string;
  email_sent: boolean;
  calendar_event_id: string | null;
};

export type EmailTemplateKey =
  | "welcome"
  | "onboarding"
  | "milestone"
  | "payment_reminder"
  | "payment_overdue"
  | "payment_thank_you"
  | "contract_reminder"
  | "coaching_completion"
  | "re_engagement"
  | "custom";

export type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmailLogStatus = "sent" | "skipped" | "failed";

export type EmailLog = {
  id: string;
  client_id: string | null;
  template_key: string;
  subject: string;
  status: EmailLogStatus;
  sent_at: string;
};

type Relationships = { Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      } & Relationships;
      clients: {
        Row: Client;
        Insert: Partial<Client> & { full_name: string };
        Update: Partial<Client>;
      } & Relationships;
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & { client_id: string; amount: number };
        Update: Partial<Payment>;
      } & Relationships;
      client_notes: {
        Row: ClientNote;
        Insert: Partial<ClientNote> & { client_id: string; body: string };
        Update: Partial<ClientNote>;
      } & Relationships;
      client_checkins: {
        Row: ClientCheckin;
        Insert: Partial<ClientCheckin> & { client_id: string };
        Update: Partial<ClientCheckin>;
      } & Relationships;
      client_attachments: {
        Row: ClientAttachment;
        Insert: Partial<ClientAttachment> & {
          client_id: string;
          file_name: string;
          file_path: string;
          file_type: AttachmentType;
        };
        Update: Partial<ClientAttachment>;
      } & Relationships;
      communications: {
        Row: Communication;
        Insert: Partial<Communication> & { client_id: string; type: CommunicationType };
        Update: Partial<Communication>;
      } & Relationships;
      leads: {
        Row: Lead;
        Insert: Partial<Lead> & { full_name: string };
        Update: Partial<Lead>;
      } & Relationships;
      activities: {
        Row: Activity;
        Insert: Partial<Activity> & {
          entity_type: ActivityEntityType;
          entity_id: string;
          type: string;
          description: string;
        };
        Update: Partial<Activity>;
      } & Relationships;
      tasks: {
        Row: Task;
        Insert: Partial<Task> & { title: string };
        Update: Partial<Task>;
      } & Relationships;
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { type: string; title: string };
        Update: Partial<Notification>;
      } & Relationships;
      calendar_events: {
        Row: CalendarEvent;
        Insert: Partial<CalendarEvent> & { title: string; starts_at: string };
        Update: Partial<CalendarEvent>;
      } & Relationships;
      google_calendar_connection: {
        Row: GoogleCalendarConnection;
        Insert: Partial<GoogleCalendarConnection> & {
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
        };
        Update: Partial<GoogleCalendarConnection>;
      } & Relationships;
      milestone_notifications: {
        Row: MilestoneNotification;
        Insert: Partial<MilestoneNotification> & { client_id: string; month: number };
        Update: Partial<MilestoneNotification>;
      } & Relationships;
      email_templates: {
        Row: EmailTemplate;
        Insert: Partial<EmailTemplate> & { key: string; name: string; subject: string; body_html: string };
        Update: Partial<EmailTemplate>;
      } & Relationships;
      email_log: {
        Row: EmailLog;
        Insert: Partial<EmailLog> & { template_key: string; subject: string };
        Update: Partial<EmailLog>;
      } & Relationships;
    };
    Views: {
      client_overview: { Row: ClientOverview } & Relationships;
    };
    Functions: Record<string, never>;
  };
};
