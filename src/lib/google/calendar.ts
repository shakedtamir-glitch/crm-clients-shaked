import type { SupabaseClient } from "@supabase/supabase-js";
import { parseISO, addDays, format } from "date-fns";
import type { Database } from "@/lib/supabase/types";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }
  return { clientId, clientSecret };
}

export function getGoogleOAuthUrl(redirectUri: string, state: string) {
  const { clientId } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json();
}

export async function getGoogleUserEmail(accessToken: string): Promise<string | null> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email ?? null;
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Returns a valid access token + the calendar_id to write to, refreshing the
 * stored token if it has expired. Returns null if no Google account is
 * connected. Uses the service-role client since this runs in cron/system
 * context with no user session.
 */
export async function getValidGoogleAccess(
  supabase: SupabaseClient<Database>
): Promise<{ accessToken: string; calendarId: string } | null> {
  const { data: connection } = await supabase.from("google_calendar_connection").select("*").limit(1).maybeSingle();
  if (!connection) return null;

  const expiresAt = new Date(connection.token_expires_at).getTime();
  const now = Date.now();

  if (expiresAt > now + 60_000) {
    return { accessToken: connection.access_token, calendarId: connection.calendar_id };
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();

  await supabase
    .from("google_calendar_connection")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiresAt })
    .eq("id", connection.id);

  return { accessToken: refreshed.access_token, calendarId: connection.calendar_id };
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: { summary: string; description: string; date: string }
): Promise<string | null> {
  const endDate = format(addDays(parseISO(event.date), 1), "yyyy-MM-dd");

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: { date: event.date },
        end: { date: endDate },
      }),
    }
  );

  if (!res.ok) {
    console.error("Google Calendar event creation failed:", await res.text());
    return null;
  }

  const data = await res.json();
  return data.id ?? null;
}
