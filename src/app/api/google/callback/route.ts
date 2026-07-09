import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getGoogleUserEmail } from "@/lib/google/calendar";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("google_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/settings?google_error=state_mismatch", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const redirectUri = new URL("/api/google/callback", request.url).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL("/settings?google_error=no_refresh_token", request.url));
    }

    const email = await getGoogleUserEmail(tokens.access_token);

    const { data: existing } = await supabase.from("google_calendar_connection").select("id").maybeSingle();
    if (existing) {
      await supabase.from("google_calendar_connection").delete().eq("id", existing.id);
    }

    await supabase.from("google_calendar_connection").insert({
      connected_by: user.id,
      connected_email: email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });

    const response = NextResponse.redirect(new URL("/settings?google_connected=1", request.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return NextResponse.redirect(new URL("/settings?google_error=exchange_failed", request.url));
  }
}
